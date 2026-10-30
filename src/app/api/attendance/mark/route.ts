import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { validateDynamicQrToken } from "@/lib/qr-security";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in before scanning." },
        { status: 401 }
      );
    }

    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only registered students can mark attendance via QR scan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { qrData, deviceInfo } = body;

    if (!qrData) {
      return NextResponse.json(
        { error: "No QR scan data received. Please scan again." },
        { status: 400 }
      );
    }

    // Parse the QR content (it can be JSON string or parsed object)
    let parsed: any;
    try {
      parsed = typeof qrData === "string" ? JSON.parse(qrData) : qrData;
    } catch {
      return NextResponse.json(
        { error: "Invalid QR code format. Please ensure you are scanning the classroom projector." },
        { status: 400 }
      );
    }

    const sessionId = parsed.sid;
    const token = parsed.t;
    const windowIndex = parsed.w;

    if (!sessionId || !token || windowIndex === undefined) {
      return NextResponse.json(
        { error: "Malformed QR code payload. Missing session or security token." },
        { status: 400 }
      );
    }

    // 1. Fetch Session from Database
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        course: true,
        faculty: { select: { name: true } },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Attendance session not found or has been removed." },
        { status: 404 }
      );
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This attendance session has already closed. Attendance can no longer be marked." },
        { status: 400 }
      );
    }

    // 2. Validate Dynamic Token Expiry / Anti-Proxy
    const validation = validateDynamicQrToken(
      session.id,
      session.qrSecret,
      token,
      Number(windowIndex)
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error:
            validation.reason ||
            "QR code has expired! Live dynamic scan is required to prevent screenshot sharing.",
          isExpired: true,
        },
        { status: 400 }
      );
    }

    // 3. Check Course Enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId: session.courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        {
          error: `You are not enrolled in ${session.course.code} - ${session.course.name}. Attendance denied.`,
        },
        { status: 403 }
      );
    }

    // 4. Duplicate Check
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        sessionId_studentId: {
          sessionId: session.id,
          studentId: user.id,
        },
      },
    });

    if (existingAttendance) {
      const timeStr = new Date(existingAttendance.markedAt).toLocaleTimeString();
      return NextResponse.json(
        {
          error: `You have already marked attendance for this session at ${timeStr}. Duplicate submissions are prevented.`,
          alreadyMarked: true,
          markedAt: existingAttendance.markedAt,
          status: existingAttendance.status,
        },
        { status: 409 }
      );
    }

    // 5. Record Attendance Atomically
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const attendanceRecord = await prisma.attendance.create({
      data: {
        sessionId: session.id,
        studentId: user.id,
        status: "PRESENT",
        verificationMethod: "QR_SCAN",
        deviceInfo: deviceInfo || "Web Mobile Browser",
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance recorded successfully!",
      attendance: {
        id: attendanceRecord.id,
        markedAt: attendanceRecord.markedAt,
        status: attendanceRecord.status,
        courseCode: session.course.code,
        courseName: session.course.name,
        sessionTitle: session.title,
        classroom: session.classroomName,
        facultyName: session.faculty.name,
        studentName: user.name,
        rollNumber: user.rollNumber,
      },
    });
  } catch (err: any) {
    console.error("Attendance Marking Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to mark attendance due to server error." },
      { status: 500 }
    );
  }
}


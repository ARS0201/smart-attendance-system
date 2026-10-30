import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          include: {
            enrollments: {
              include: {
                student: true,
              },
            },
          },
        },
        attendances: {
          include: {
            student: true,
          },
        },
        faculty: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const attendanceMap = new Map();
    session.attendances.forEach((a) => {
      attendanceMap.set(a.studentId, a);
    });

    // Generate CSV content
    const rows = [
      ["Smart Attendance System - Session Report"],
      [`Course: ${session.course.code} - ${session.course.name}`],
      [`Session: ${session.title}`],
      [`Faculty: ${session.faculty.name}`],
      [`Date: ${new Date(session.sessionDate).toLocaleDateString()}`],
      [`Classroom: ${session.classroomName || "N/A"}`],
      [],
      ["Roll Number", "Student Name", "Email", "Status", "Marked Time", "Verification Method"],
    ];

    session.course.enrollments.forEach((e) => {
      const student = e.student;
      const att = attendanceMap.get(student.id);
      rows.push([
        student.rollNumber || "N/A",
        `"${student.name}"`,
        student.email,
        att ? att.status : "ABSENT",
        att ? new Date(att.markedAt).toLocaleTimeString() : "--",
        att ? att.verificationMethod : "NOT_MARKED",
      ]);
    });

    const csvString = rows.map((r) => r.join(",")).join("\n");

    const filename = `Attendance_${session.course.code}_${new Date(session.sessionDate).toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Export Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


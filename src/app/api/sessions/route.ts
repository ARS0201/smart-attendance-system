import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const courseId = searchParams.get("courseId");

    const whereClause: any = {};
    if (user.role === "FACULTY") {
      whereClause.facultyId = user.id;
    }
    if (status) {
      whereClause.status = status;
    }
    if (courseId) {
      whereClause.courseId = courseId;
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        course: true,
        attendances: {
          include: {
            student: {
              select: { id: true, name: true, rollNumber: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, sessions });
  } catch (err: any) {
    console.error("Fetch Sessions Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Faculty or Admin only." }, { status: 403 });
    }

    const body = await request.json();
    const { courseId, title, classroomName } = body;

    if (!courseId || !title) {
      return NextResponse.json({ error: "Course and Session Title are required." }, { status: 400 });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      return NextResponse.json({ error: "Selected course does not exist." }, { status: 404 });
    }

    // Generate secure random secret for dynamic QR HMAC rotation
    const qrSecret = crypto.randomBytes(32).toString("hex");

    const session = await prisma.session.create({
      data: {
        courseId,
        facultyId: user.id,
        title,
        classroomName: classroomName || "Main Hall",
        status: "ACTIVE",
        qrSecret,
        sessionDate: new Date(),
        startTime: new Date(),
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    console.error("Create Session Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


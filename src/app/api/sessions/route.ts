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
    const targetClass = searchParams.get("targetClass");

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
    if (targetClass && targetClass !== "ALL") {
      whereClause.OR = [{ targetClass }, { targetClass: "ALL" }];
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        course: true,
        attendances: {
          include: {
            student: {
              select: { id: true, name: true, rollNumber: true, email: true, className: true },
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
    const { courseId, newCourseCode, newCourseName, title, classroomName, targetClass } = body;

    if (!title) {
      return NextResponse.json({ error: "Session Title is required." }, { status: 400 });
    }

    let effectiveCourseId = courseId;

    // If faculty is creating a new course on the fly
    if (courseId === "NEW" || (!courseId && newCourseCode)) {
      if (!newCourseCode) {
        return NextResponse.json({ error: "Please enter Course Code (e.g. CS301)." }, { status: 400 });
      }
      const cleanCode = newCourseCode.trim().toUpperCase();
      const existing = await prisma.course.findUnique({ where: { code: cleanCode } });

      if (existing) {
        effectiveCourseId = existing.id;
      } else {
        const created = await prisma.course.create({
          data: {
            code: cleanCode,
            name: newCourseName?.trim() || cleanCode,
            department: user.department || "Computer Science & Engineering",
            semester: 5,
            facultyId: user.id,
          },
        });
        effectiveCourseId = created.id;
      }
    }

    if (!effectiveCourseId) {
      // Pick first available course if still unset
      const firstCourse = await prisma.course.findFirst();
      if (firstCourse) {
        effectiveCourseId = firstCourse.id;
      } else {
        const created = await prisma.course.create({
          data: {
            code: "CS301",
            name: "Database Management Systems",
            department: user.department || "Computer Science & Engineering",
            semester: 5,
            facultyId: user.id,
          },
        });
        effectiveCourseId = created.id;
      }
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: effectiveCourseId },
    });
    if (!course) {
      return NextResponse.json({ error: "Selected course does not exist." }, { status: 404 });
    }

    // Generate secure random secret for dynamic QR HMAC rotation
    const qrSecret = crypto.randomBytes(32).toString("hex");

    const session = await prisma.session.create({
      data: {
        courseId: effectiveCourseId,
        facultyId: user.id,
        title: title.trim(),
        targetClass: targetClass?.trim().toUpperCase() || "CSE-A",
        classroomName: classroomName?.trim() || "Auditorium Hall 101",
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

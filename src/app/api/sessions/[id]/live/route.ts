import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            enrollments: {
              include: {
                student: {
                  select: { id: true, name: true, rollNumber: true, email: true },
                },
              },
            },
          },
        },
        attendances: {
          include: {
            student: {
              select: { id: true, name: true, rollNumber: true, email: true },
            },
          },
          orderBy: { markedAt: "desc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const enrolledStudents = session.course.enrollments.map((e) => e.student);
    const attendedStudentIds = new Set(session.attendances.map((a) => a.studentId));

    const absentStudents = enrolledStudents.filter(
      (student) => !attendedStudentIds.has(student.id)
    );

    const totalEnrolled = enrolledStudents.length;
    const totalPresent = session.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const totalOnDuty = session.attendances.filter((a) => a.status === "ON_DUTY").length;
    const attendancePercentage = totalEnrolled > 0 ? Math.round(((totalPresent + totalOnDuty) / totalEnrolled) * 100) : 0;

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        classroomName: session.classroomName,
        startTime: session.startTime,
        endTime: session.endTime,
        courseCode: session.course.code,
        courseName: session.course.name,
      },
      stats: {
        totalEnrolled,
        totalPresent,
        totalOnDuty,
        totalUnmarked: absentStudents.length,
        attendancePercentage,
      },
      attendances: session.attendances,
      absentStudents,
    });
  } catch (err: any) {
    console.error("Live Session Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


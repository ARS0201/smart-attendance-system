import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized: Student access only" }, { status: 403 });
    }

    // 1. Fetch Student's enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      include: {
        course: {
          include: {
            faculty: { select: { name: true } },
            sessions: {
              include: {
                attendances: {
                  where: { studentId: user.id },
                },
              },
            },
          },
        },
      },
    });

    // 2. Calculate Course stats
    let totalClassesAllCourses = 0;
    let totalPresentAllCourses = 0;
    let totalOdAllCourses = 0;

    const courseStats = enrollments.map((e) => {
      const course = e.course;
      const totalSessions = course.sessions.length;
      let presentCount = 0;
      let odCount = 0;

      course.sessions.forEach((s) => {
        const att = s.attendances[0];
        if (att) {
          if (att.status === "PRESENT" || att.status === "LATE") {
            presentCount++;
          } else if (att.status === "ON_DUTY") {
            odCount++;
          }
        }
      });

      const effectiveAttendance = presentCount + odCount;
      const percentage = totalSessions > 0 ? Math.round((effectiveAttendance / totalSessions) * 100) : 100;

      totalClassesAllCourses += totalSessions;
      totalPresentAllCourses += presentCount;
      totalOdAllCourses += odCount;

      return {
        id: course.id,
        code: course.code,
        name: course.name,
        facultyName: course.faculty.name,
        totalSessions,
        presentCount,
        odCount,
        absentCount: Math.max(0, totalSessions - effectiveAttendance),
        percentage,
        isLowAttendance: percentage < 75 && totalSessions > 0,
      };
    });

    const overallEffective = totalPresentAllCourses + totalOdAllCourses;
    const overallPercentage =
      totalClassesAllCourses > 0
        ? Math.round((overallEffective / totalClassesAllCourses) * 100)
        : 100;

    // 3. Active Sessions right now for enrolled courses
    const enrolledCourseIds = enrollments.map((e) => e.courseId);
    const activeSessions = await prisma.session.findMany({
      where: {
        status: "ACTIVE",
        courseId: { in: enrolledCourseIds },
      },
      include: {
        course: { select: { code: true, name: true } },
        faculty: { select: { name: true } },
        attendances: {
          where: { studentId: user.id },
        },
      },
      orderBy: { startTime: "desc" },
    });

    const formattedActiveSessions = activeSessions.map((s) => ({
      id: s.id,
      title: s.title,
      classroom: s.classroomName,
      courseCode: s.course.code,
      courseName: s.course.name,
      facultyName: s.faculty.name,
      startTime: s.startTime,
      isAlreadyMarked: s.attendances.length > 0,
      markedStatus: s.attendances[0]?.status || null,
      markedAt: s.attendances[0]?.markedAt || null,
    }));

    // 4. Recent Attendance Records
    const recentAttendances = await prisma.attendance.findMany({
      where: { studentId: user.id },
      include: {
        session: {
          include: {
            course: { select: { code: true, name: true } },
            faculty: { select: { name: true } },
          },
        },
      },
      orderBy: { markedAt: "desc" },
      take: 10,
    });

    // 5. Recent OD Requests
    const recentOds = await prisma.odRequest.findMany({
      where: { studentId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      user,
      summary: {
        totalClasses: totalClassesAllCourses,
        totalPresent: totalPresentAllCourses,
        totalOnDuty: totalOdAllCourses,
        overallPercentage,
        isWarning: overallPercentage < 75 && totalClassesAllCourses > 0,
      },
      courses: courseStats,
      activeSessions: formattedActiveSessions,
      recentAttendances,
      recentOds,
    });
  } catch (err: any) {
    console.error("Student Dashboard Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


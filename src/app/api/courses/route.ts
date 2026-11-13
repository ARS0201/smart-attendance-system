import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all available courses across the department/college so the faculty list is NEVER empty
    let courses = await prisma.course.findMany({
      include: {
        faculty: { select: { name: true, email: true } },
        _count: {
          select: {
            enrollments: true,
            sessions: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    // If no courses exist yet, auto-create standard college courses so faculty always has options
    if (courses.length === 0) {
      const defaults = [
        { code: "CS301", name: "Database Management Systems", dept: "Computer Science & Engineering", sem: 5 },
        { code: "CS302", name: "Operating Systems & Kernels", dept: "Computer Science & Engineering", sem: 5 },
        { code: "CS303", name: "Computer Networks & Security", dept: "Computer Science & Engineering", sem: 5 },
        { code: "IT304", name: "Full Stack Web Development", dept: "Information Technology", sem: 5 },
        { code: "EC305", name: "Digital Signal Processing", dept: "Electronics & Communication", sem: 5 },
      ];

      for (const d of defaults) {
        await prisma.course.upsert({
          where: { code: d.code },
          update: {},
          create: {
            code: d.code,
            name: d.name,
            department: d.dept,
            semester: d.sem,
            facultyId: user.id,
          },
        });
      }

      courses = await prisma.course.findMany({
        include: {
          faculty: { select: { name: true, email: true } },
          _count: {
            select: {
              enrollments: true,
              sessions: true,
            },
          },
        },
        orderBy: { code: "asc" },
      });
    }

    return NextResponse.json({ success: true, courses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, department, semester } = body;

    if (!code || !name) {
      return NextResponse.json({ error: "Course code and name are required." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const course = await prisma.course.upsert({
      where: { code: cleanCode },
      update: {
        name: name.trim(),
        facultyId: user.id,
      },
      create: {
        code: cleanCode,
        name: name.trim(),
        department: department || user.department || "Engineering",
        semester: Number(semester) || 5,
        facultyId: user.id,
      },
    });

    return NextResponse.json({ success: true, course });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

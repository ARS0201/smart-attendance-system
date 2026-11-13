import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, rollNumber, department } = body;

    // 1. Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const userRole = role === "FACULTY" ? "FACULTY" : "STUDENT";

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (userRole === "STUDENT" && !rollNumber) {
      return NextResponse.json(
        { error: "Roll number is required for student registration." },
        { status: 400 }
      );
    }

    // 2. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    // 3. Check if roll number already exists (for students)
    if (userRole === "STUDENT" && rollNumber) {
      const existingRoll = await prisma.user.findUnique({
        where: { rollNumber: rollNumber.trim().toUpperCase() },
      });

      if (existingRoll) {
        return NextResponse.json(
          { error: "An account with this Roll Number already exists." },
          { status: 409 }
        );
      }
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create user in database
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: userRole,
        rollNumber: userRole === "STUDENT" ? rollNumber.trim().toUpperCase() : null,
        department: department?.trim() || "Computer Science & Engineering",
      },
    });

    // 6. If student, auto-enroll them in all available courses so they can immediately scan and attend
    if (userRole === "STUDENT") {
      try {
        const availableCourses = await prisma.course.findMany({
          select: { id: true },
        });

        if (availableCourses.length > 0) {
          await prisma.enrollment.createMany({
            data: availableCourses.map((c) => ({
              studentId: newUser.id,
              courseId: c.id,
            })),
            // skipDuplicates prevents errors if already enrolled
          });
        }
      } catch (enrollErr) {
        console.warn("Auto-enrollment skipped:", enrollErr);
      }
    }

    // 7. Establish authenticated session
    const sessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as "STUDENT" | "FACULTY" | "ADMIN",
      rollNumber: newUser.rollNumber,
      department: newUser.department,
    };

    await setSessionCookie(sessionUser);

    const redirectUrl = userRole === "FACULTY" ? "/faculty" : "/student";

    return NextResponse.json({
      success: true,
      message: "Account created successfully!",
      user: sessionUser,
      redirectUrl,
    });
  } catch (err: any) {
    console.error("Signup Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create account due to server error." },
      { status: 500 }
    );
  }
}


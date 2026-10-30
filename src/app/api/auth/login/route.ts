import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, demoRole } = body;

    let user;

    if (demoRole) {
      // Quick Persona Login for seamless demoing
      if (demoRole === "FACULTY") {
        user = await prisma.user.findFirst({ where: { role: "FACULTY" } });
      } else if (demoRole === "STUDENT") {
        user = await prisma.user.findFirst({ where: { role: "STUDENT" } });
      } else if (demoRole === "ADMIN") {
        user = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      }
    } else {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
      }

      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        return NextResponse.json({ error: "Invalid credentials. User not found." }, { status: 401 });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Invalid credentials. Password incorrect." }, { status: 401 });
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "STUDENT" | "FACULTY" | "ADMIN",
      rollNumber: user.rollNumber,
      department: user.department,
    };

    await setSessionCookie(sessionUser);

    const redirectUrl =
      sessionUser.role === "FACULTY"
        ? "/faculty"
        : sessionUser.role === "ADMIN"
        ? "/admin"
        : "/student";

    return NextResponse.json({
      success: true,
      user: sessionUser,
      redirectUrl,
    });
  } catch (err: any) {
    console.error("Login Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error during login." },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Faculty or Admin only." }, { status: 403 });
    }

    const body = await request.json();
    const { sessionId, studentId, status, notes } = body;

    if (!sessionId || !studentId || !status) {
      return NextResponse.json(
        { error: "Session ID, Student ID, and status are required." },
        { status: 400 }
      );
    }

    // Upsert attendance record
    const attendance = await prisma.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId,
        },
      },
      update: {
        status,
        verificationMethod: "MANUAL_FACULTY",
        notes: notes || `Manual override by ${user.name}`,
        markedAt: new Date(),
      },
      create: {
        sessionId,
        studentId,
        status,
        verificationMethod: "MANUAL_FACULTY",
        notes: notes || `Manual entry by ${user.name}`,
        markedAt: new Date(),
      },
      include: {
        student: { select: { name: true, rollNumber: true } },
      },
    });

    return NextResponse.json({ success: true, attendance });
  } catch (err: any) {
    console.error("Manual Override Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


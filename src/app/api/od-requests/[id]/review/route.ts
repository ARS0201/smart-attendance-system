import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized: Faculty or Admin only." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, remarks } = body;

    if (!status || (status !== "APPROVED" && status !== "REJECTED")) {
      return NextResponse.json(
        { error: "Status must be either APPROVED or REJECTED." },
        { status: 400 }
      );
    }

    const odRequest = await prisma.odRequest.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!odRequest) {
      return NextResponse.json({ error: "On-Duty request not found." }, { status: 404 });
    }

    // Update OD status
    const updatedOd = await prisma.odRequest.update({
      where: { id },
      data: {
        status,
        remarks: remarks || (status === "APPROVED" ? "Approved by faculty" : "Rejected by faculty"),
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    });

    // If APPROVED, update any sessions occurring in the OD date range
    let updatedAttendanceCount = 0;
    if (status === "APPROVED") {
      const fromStart = new Date(odRequest.fromDate);
      fromStart.setHours(0, 0, 0, 0);

      const toEnd = new Date(odRequest.toDate);
      toEnd.setHours(23, 59, 59, 999);

      // Find sessions during this window where student was absent or not marked
      const affectedSessions = await prisma.session.findMany({
        where: {
          sessionDate: {
            gte: fromStart,
            lte: toEnd,
          },
          course: {
            enrollments: {
              some: { studentId: odRequest.studentId },
            },
          },
        },
      });

      for (const session of affectedSessions) {
        await prisma.attendance.upsert({
          where: {
            sessionId_studentId: {
              sessionId: session.id,
              studentId: odRequest.studentId,
            },
          },
          update: {
            status: "ON_DUTY",
            verificationMethod: "OD_APPROVED",
            notes: `OD Approved: ${odRequest.title}`,
          },
          create: {
            sessionId: session.id,
            studentId: odRequest.studentId,
            status: "ON_DUTY",
            verificationMethod: "OD_APPROVED",
            notes: `OD Approved: ${odRequest.title}`,
          },
        });
        updatedAttendanceCount++;
      }
    }

    return NextResponse.json({
      success: true,
      odRequest: updatedOd,
      message:
        status === "APPROVED"
          ? `OD approved successfully. Adjusted ${updatedAttendanceCount} session(s) to On-Duty status.`
          : "OD request marked as rejected.",
    });
  } catch (err: any) {
    console.error("OD Review Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


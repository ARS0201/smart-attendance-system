import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createDynamicQrPayload } from "@/lib/qr-security";

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
        course: { select: { code: true, name: true } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Session is no longer active", status: session.status },
        { status: 400 }
      );
    }

    // Generate real-time rotating QR payload
    const qrData = createDynamicQrPayload(session.id, session.qrSecret, session.classroomName);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      courseCode: session.course.code,
      courseName: session.course.name,
      sessionTitle: session.title,
      classroom: session.classroomName,
      ...qrData,
    });
  } catch (err: any) {
    console.error("Fetch Token Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


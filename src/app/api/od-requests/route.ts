import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let whereClause: any = {};

    if (user.role === "STUDENT") {
      whereClause.studentId = user.id;
    }

    if (status) {
      whereClause.status = status;
    }

    const odRequests = await prisma.odRequest.findMany({
      where: whereClause,
      include: {
        student: {
          select: { id: true, name: true, rollNumber: true, email: true, department: true },
        },
        reviewedBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, odRequests });
  } catch (err: any) {
    console.error("Fetch OD Requests Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can submit On-Duty requests." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, category, fromDate, toDate, reason, documentUrl } = body;

    if (!title || !category || !fromDate || !toDate || !reason) {
      return NextResponse.json(
        { error: "Title, category, dates, and reason are required." },
        { status: 400 }
      );
    }

    const parsedFrom = new Date(fromDate);
    const parsedTo = new Date(toDate);

    if (isNaN(parsedFrom.getTime()) || isNaN(parsedTo.getTime())) {
      return NextResponse.json({ error: "Invalid date format provided." }, { status: 400 });
    }

    if (parsedFrom > parsedTo) {
      return NextResponse.json(
        { error: "From Date cannot be later than To Date." },
        { status: 400 }
      );
    }

    const odRequest = await prisma.odRequest.create({
      data: {
        studentId: user.id,
        title,
        category,
        fromDate: parsedFrom,
        toDate: parsedTo,
        reason,
        documentUrl: documentUrl || "https://example.com/sample_od_proof.pdf",
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "On-Duty request submitted successfully for faculty review.",
      odRequest,
    });
  } catch (err: any) {
    console.error("Submit OD Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


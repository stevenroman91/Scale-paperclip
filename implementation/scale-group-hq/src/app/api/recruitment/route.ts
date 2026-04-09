import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

const candidateSchema = z.object({
  position: z.string().min(1),
  subsidiaryId: z.string().min(1),
  candidateName: z.string().min(1),
  candidateEmail: z.string().email(),
  status: z
    .enum(["SOURCING", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"])
    .optional()
    .default("SOURCING"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const subsidiaryId = searchParams.get("subsidiaryId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (subsidiaryId) where.subsidiaryId = subsidiaryId;

    const pipeline = await prisma.recruitmentPipeline.findMany({
      where,
      include: { subsidiary: true },
      orderBy: { updatedAt: "desc" },
    });

    // Group by status for kanban view
    const kanban: Record<string, typeof pipeline> = {
      SOURCING: [],
      SCREENING: [],
      INTERVIEW: [],
      OFFER: [],
      HIRED: [],
      REJECTED: [],
    };

    for (const entry of pipeline) {
      kanban[entry.status].push(entry);
    }

    return NextResponse.json({ pipeline, kanban, total: pipeline.length });
  } catch (error) {
    console.error("Recruitment GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recruitment data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = candidateSchema.parse(body);

    const candidate = await prisma.recruitmentPipeline.create({
      data: validated,
      include: { subsidiary: true },
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Recruitment POST error:", error);
    return NextResponse.json(
      { error: "Failed to create candidate" },
      { status: 500 }
    );
  }
}

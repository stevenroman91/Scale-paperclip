import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

const contentSchema = z.object({
  title: z.string().min(1),
  platform: z.enum(["LINKEDIN"]).optional().default("LINKEDIN"),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]).optional().default("DRAFT"),
  content: z.string().min(1),
  engagement: z
    .object({
      likes: z.number().optional(),
      comments: z.number().optional(),
      shares: z.number().optional(),
      impressions: z.number().optional(),
    })
    .optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (platform) where.platform = platform;

    const entries = await prisma.contentCalendar.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
    });

    // Aggregate engagement stats
    const stats = {
      total: entries.length,
      byStatus: {
        DRAFT: entries.filter((e) => e.status === "DRAFT").length,
        SCHEDULED: entries.filter((e) => e.status === "SCHEDULED").length,
        PUBLISHED: entries.filter((e) => e.status === "PUBLISHED").length,
      },
      totalEngagement: entries.reduce(
        (acc, e) => {
          const eng = e.engagement as Record<string, number> | null;
          if (eng) {
            acc.likes += eng.likes || 0;
            acc.comments += eng.comments || 0;
            acc.shares += eng.shares || 0;
            acc.impressions += eng.impressions || 0;
          }
          return acc;
        },
        { likes: 0, comments: 0, shares: 0, impressions: 0 }
      ),
    };

    return NextResponse.json({ entries, stats });
  } catch (error) {
    console.error("Content GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content calendar" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = contentSchema.parse(body);

    const entry = await prisma.contentCalendar.create({
      data: {
        ...validated,
        scheduledAt: validated.scheduledAt
          ? new Date(validated.scheduledAt)
          : null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Content POST error:", error);
    return NextResponse.json(
      { error: "Failed to create content entry" },
      { status: 500 }
    );
  }
}

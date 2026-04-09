import { NextResponse } from "next/server";
import {
  getHeadcountBySubsidiary,
  calculateTurnover,
  getRecruitmentFunnel,
  calculateCostPerHire,
} from "@/lib/services/hr-analytics";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "overview";

    switch (view) {
      case "headcount": {
        const headcount = await getHeadcountBySubsidiary();
        return NextResponse.json(headcount);
      }

      case "turnover": {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1); // Start of year
        const turnover = await calculateTurnover({ start, end: now });
        return NextResponse.json(turnover);
      }

      case "funnel": {
        const funnel = await getRecruitmentFunnel();
        return NextResponse.json(funnel);
      }

      case "cost-per-hire": {
        const costPerHire = await calculateCostPerHire();
        return NextResponse.json(costPerHire);
      }

      case "overview":
      default: {
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1);

        const [headcount, turnover, funnel, costPerHire] = await Promise.all([
          getHeadcountBySubsidiary(),
          calculateTurnover({ start: yearStart, end: now }),
          getRecruitmentFunnel(),
          calculateCostPerHire(),
        ]);

        return NextResponse.json({
          headcount,
          turnover,
          funnel,
          costPerHire,
        });
      }
    }
  } catch (error) {
    console.error("HR API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch HR data" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import {
  consolidateTreasury,
  getConsolidatedPnL,
  generateCashFlowForecast,
} from "@/lib/services/finance";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "overview";

    switch (view) {
      case "treasury": {
        const treasury = await consolidateTreasury();
        return NextResponse.json(treasury);
      }

      case "pnl": {
        const pnl = await getConsolidatedPnL();
        return NextResponse.json(pnl);
      }

      case "forecast": {
        const months = parseInt(searchParams.get("months") || "6", 10);
        const forecast = await generateCashFlowForecast(months);
        return NextResponse.json(forecast);
      }

      case "overview":
      default: {
        const [treasury, pnl, forecast] = await Promise.all([
          consolidateTreasury(),
          getConsolidatedPnL(),
          generateCashFlowForecast(6),
        ]);

        return NextResponse.json({
          treasury,
          pnl,
          forecast,
        });
      }
    }
  } catch (error) {
    console.error("Finance API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial data" },
      { status: 500 }
    );
  }
}

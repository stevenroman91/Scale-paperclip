import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generatePayrollRun, calculateGrossToNet } from "@/lib/services/payroll-fr";
import type { ContractType } from "@/lib/services/payroll-fr";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (month && year) {
      // Get specific payroll run
      const payrollRun = await prisma.payrollRun.findUnique({
        where: {
          month_year: {
            month: parseInt(month, 10),
            year: parseInt(year, 10),
          },
        },
        include: {
          lines: {
            include: { employee: true },
          },
        },
      });

      if (!payrollRun) {
        return NextResponse.json(
          { error: "Payroll run not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(payrollRun);
    }

    // List all payroll runs
    const payrollRuns = await prisma.payrollRun.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        _count: { select: { lines: true } },
      },
    });

    return NextResponse.json(payrollRuns);
  } catch (error) {
    console.error("Payroll GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payroll data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, month, year, grossSalary, contractType } = body;

    switch (action) {
      case "generate": {
        if (!month || !year) {
          return NextResponse.json(
            { error: "month and year are required" },
            { status: 400 }
          );
        }
        const result = await generatePayrollRun(
          parseInt(month, 10),
          parseInt(year, 10)
        );
        return NextResponse.json(result, { status: 201 });
      }

      case "simulate": {
        if (!grossSalary || !contractType) {
          return NextResponse.json(
            { error: "grossSalary and contractType are required" },
            { status: 400 }
          );
        }
        const breakdown = calculateGrossToNet(
          parseFloat(grossSalary),
          contractType as ContractType
        );
        return NextResponse.json(breakdown);
      }

      case "mark-paid": {
        if (!month || !year) {
          return NextResponse.json(
            { error: "month and year are required" },
            { status: 400 }
          );
        }
        const updated = await prisma.payrollRun.update({
          where: {
            month_year: {
              month: parseInt(month, 10),
              year: parseInt(year, 10),
            },
          },
          data: { status: "PAID" },
        });
        return NextResponse.json(updated);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: generate, simulate, or mark-paid" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Payroll POST error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process payroll";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

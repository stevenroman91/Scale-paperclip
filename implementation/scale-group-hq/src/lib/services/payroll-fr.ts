import prisma from "@/lib/db";

/**
 * French Payroll Service for Scale Group HQ
 * Handles gross-to-net calculation with French social charges,
 * and payroll run generation.
 */

// ─── French Social Charges Rates (2024/2025) ────────────────────

export const FRENCH_SOCIAL_CHARGES = {
  employee: {
    csg_deductible: 0.068, // CSG deductible
    csg_non_deductible: 0.024, // CSG non-deductible (CRDS included)
    retirement_base: 0.069, // Retraite de base (tranche 1)
    retirement_complementary: 0.0386, // AGIRC-ARRCO tranche 1
    unemployment: 0.0, // Suppressed since Oct 2018
    health: 0.0, // Suppressed since Jan 2018
    cet: 0.0013, // Contribution d'equilibre technique
    apec: 0.0024, // APEC (cadres only, applied to all here as estimate)
  },
  employer: {
    health: 0.13, // Assurance maladie
    family: 0.0525, // Allocations familiales
    retirement_base: 0.086, // Retraite de base (tranche 1)
    retirement_complementary: 0.0601, // AGIRC-ARRCO tranche 1
    unemployment: 0.0405, // Assurance chomage
    accident: 0.02, // Accident du travail (average rate)
    autonomy: 0.003, // Contribution solidarite autonomie
    fnal: 0.005, // FNAL
    transport: 0.0175, // Versement mobilite (Paris area)
    formation: 0.0055, // Formation professionnelle
    construction: 0.0045, // Participation construction
    cet: 0.0021, // Contribution d'equilibre technique
    apec: 0.0036, // APEC (cadres)
    ags: 0.0015, // AGS (garantie des salaires)
  },
} as const;

// Plafond mensuel de la Securite sociale (PMSS) 2025
export const PMSS_2025 = 3_864;

export type ContractType = "CDI" | "CDD" | "FREELANCE";

export interface PayrollBreakdown {
  grossSalary: number;
  contractType: ContractType;
  employeeCharges: {
    csg_deductible: number;
    csg_non_deductible: number;
    retirement_base: number;
    retirement_complementary: number;
    cet: number;
    apec: number;
    total: number;
  };
  employerCharges: {
    health: number;
    family: number;
    retirement_base: number;
    retirement_complementary: number;
    unemployment: number;
    accident: number;
    autonomy: number;
    fnal: number;
    transport: number;
    formation: number;
    construction: number;
    cet: number;
    apec: number;
    ags: number;
    total: number;
  };
  netSalary: number;
  totalCostEmployer: number;
}

/**
 * Calculate gross-to-net breakdown for a French salary.
 * Freelancers have no social charges applied (they handle their own).
 */
export function calculateGrossToNet(
  grossSalary: number,
  contractType: ContractType
): PayrollBreakdown {
  if (contractType === "FREELANCE") {
    return {
      grossSalary,
      contractType,
      employeeCharges: {
        csg_deductible: 0,
        csg_non_deductible: 0,
        retirement_base: 0,
        retirement_complementary: 0,
        cet: 0,
        apec: 0,
        total: 0,
      },
      employerCharges: {
        health: 0,
        family: 0,
        retirement_base: 0,
        retirement_complementary: 0,
        unemployment: 0,
        accident: 0,
        autonomy: 0,
        fnal: 0,
        transport: 0,
        formation: 0,
        construction: 0,
        cet: 0,
        apec: 0,
        ags: 0,
        total: 0,
      },
      netSalary: grossSalary,
      totalCostEmployer: grossSalary,
    };
  }

  // CSG/CRDS are calculated on 98.25% of gross salary
  const csgBase = grossSalary * 0.9825;

  // Employee charges
  const empCharges = {
    csg_deductible: round(csgBase * FRENCH_SOCIAL_CHARGES.employee.csg_deductible),
    csg_non_deductible: round(csgBase * FRENCH_SOCIAL_CHARGES.employee.csg_non_deductible),
    retirement_base: round(Math.min(grossSalary, PMSS_2025) * FRENCH_SOCIAL_CHARGES.employee.retirement_base),
    retirement_complementary: round(Math.min(grossSalary, PMSS_2025) * FRENCH_SOCIAL_CHARGES.employee.retirement_complementary),
    cet: round(grossSalary * FRENCH_SOCIAL_CHARGES.employee.cet),
    apec: round(grossSalary * FRENCH_SOCIAL_CHARGES.employee.apec),
    total: 0,
  };
  empCharges.total = round(
    empCharges.csg_deductible +
      empCharges.csg_non_deductible +
      empCharges.retirement_base +
      empCharges.retirement_complementary +
      empCharges.cet +
      empCharges.apec
  );

  // Employer charges
  const erRates = FRENCH_SOCIAL_CHARGES.employer;
  const erCharges = {
    health: round(grossSalary * erRates.health),
    family: round(grossSalary * erRates.family),
    retirement_base: round(Math.min(grossSalary, PMSS_2025) * erRates.retirement_base),
    retirement_complementary: round(Math.min(grossSalary, PMSS_2025) * erRates.retirement_complementary),
    unemployment: round(grossSalary * erRates.unemployment),
    accident: round(grossSalary * erRates.accident),
    autonomy: round(grossSalary * erRates.autonomy),
    fnal: round(grossSalary * erRates.fnal),
    transport: round(grossSalary * erRates.transport),
    formation: round(grossSalary * erRates.formation),
    construction: round(grossSalary * erRates.construction),
    cet: round(grossSalary * erRates.cet),
    apec: round(grossSalary * erRates.apec),
    ags: round(grossSalary * erRates.ags),
    total: 0,
  };
  erCharges.total = round(
    Object.entries(erCharges)
      .filter(([key]) => key !== "total")
      .reduce((sum, [, val]) => sum + (val as number), 0)
  );

  const netSalary = round(grossSalary - empCharges.total);
  const totalCostEmployer = round(grossSalary + erCharges.total);

  return {
    grossSalary,
    contractType,
    employeeCharges: empCharges,
    employerCharges: erCharges,
    netSalary,
    totalCostEmployer,
  };
}

/**
 * Generate a payroll run for a given month/year.
 * Creates payroll lines for all active employees.
 */
export async function generatePayrollRun(
  month: number,
  year: number
): Promise<{
  payrollRunId: string;
  totalGross: number;
  totalNet: number;
  totalCharges: number;
  lineCount: number;
}> {
  // Check for existing payroll run
  const existing = await prisma.payrollRun.findUnique({
    where: { month_year: { month, year } },
  });

  if (existing && existing.status !== "DRAFT") {
    throw new Error(
      `Payroll run for ${month}/${year} already exists with status ${existing.status}`
    );
  }

  // Get all active employees
  const employees = await prisma.employee.findMany({
    where: {
      endDate: null,
      startDate: { lte: new Date(year, month - 1, 28) }, // Started before end of month
    },
  });

  if (employees.length === 0) {
    throw new Error("No active employees found for this period");
  }

  // Calculate payroll for each employee
  const breakdowns = employees.map((emp) => ({
    employeeId: emp.id,
    breakdown: calculateGrossToNet(emp.monthlySalary, emp.contractType as ContractType),
  }));

  const totalGross = round(
    breakdowns.reduce((sum, b) => sum + b.breakdown.grossSalary, 0)
  );
  const totalNet = round(
    breakdowns.reduce((sum, b) => sum + b.breakdown.netSalary, 0)
  );
  const totalCharges = round(
    breakdowns.reduce(
      (sum, b) =>
        sum +
        b.breakdown.employeeCharges.total +
        b.breakdown.employerCharges.total,
      0
    )
  );

  // Create or update the payroll run with lines in a transaction
  const payrollRun = await prisma.$transaction(async (tx) => {
    // Delete existing draft run if any
    if (existing) {
      await tx.payrollLine.deleteMany({
        where: { payrollRunId: existing.id },
      });
      await tx.payrollRun.delete({ where: { id: existing.id } });
    }

    const run = await tx.payrollRun.create({
      data: {
        month,
        year,
        status: "CALCULATED",
        totalGross,
        totalNet,
        totalCharges,
        lines: {
          create: breakdowns.map((b) => ({
            employeeId: b.employeeId,
            grossSalary: b.breakdown.grossSalary,
            netSalary: b.breakdown.netSalary,
            employerCharges: b.breakdown.employerCharges.total,
            employeeCharges: b.breakdown.employeeCharges.total,
          })),
        },
      },
    });

    return run;
  });

  return {
    payrollRunId: payrollRun.id,
    totalGross,
    totalNet,
    totalCharges,
    lineCount: breakdowns.length,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

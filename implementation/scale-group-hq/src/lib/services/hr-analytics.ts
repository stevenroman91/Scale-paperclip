import prisma from "@/lib/db";

/**
 * HR Analytics services for Scale Group HQ
 * Headcount, turnover, recruitment funnel, and cost-per-hire metrics.
 */

export interface HeadcountBreakdown {
  total: number;
  bySubsidiary: {
    subsidiaryId: string;
    subsidiaryName: string;
    headcount: number;
    byDepartment: Record<string, number>;
    byContractType: Record<string, number>;
  }[];
}

export interface TurnoverMetrics {
  period: { start: Date; end: Date };
  totalEmployeesStart: number;
  totalEmployeesEnd: number;
  departures: number;
  hires: number;
  turnoverRate: number;
}

export interface RecruitmentFunnel {
  total: number;
  stages: {
    status: string;
    count: number;
    percentage: number;
  }[];
  bySubsidiary: Record<
    string,
    {
      subsidiaryName: string;
      total: number;
      stages: Record<string, number>;
    }
  >;
}

export interface CostPerHire {
  averageCostPerHire: number;
  totalRecruitmentCost: number;
  totalHires: number;
  averageTimeToHire: number; // in days
}

/**
 * Get headcount breakdown by subsidiary, department, and contract type.
 */
export async function getHeadcountBySubsidiary(): Promise<HeadcountBreakdown> {
  const employees = await prisma.employee.findMany({
    where: { endDate: null }, // Active employees only
    include: { subsidiary: true },
  });

  const subsidiaryMap = new Map<
    string,
    {
      subsidiaryId: string;
      subsidiaryName: string;
      employees: typeof employees;
    }
  >();

  for (const emp of employees) {
    if (!subsidiaryMap.has(emp.subsidiaryId)) {
      subsidiaryMap.set(emp.subsidiaryId, {
        subsidiaryId: emp.subsidiaryId,
        subsidiaryName: emp.subsidiary.name,
        employees: [],
      });
    }
    subsidiaryMap.get(emp.subsidiaryId)!.employees.push(emp);
  }

  const bySubsidiary = Array.from(subsidiaryMap.values()).map((group) => {
    const byDepartment: Record<string, number> = {};
    const byContractType: Record<string, number> = {};

    for (const emp of group.employees) {
      byDepartment[emp.department] =
        (byDepartment[emp.department] || 0) + 1;
      byContractType[emp.contractType] =
        (byContractType[emp.contractType] || 0) + 1;
    }

    return {
      subsidiaryId: group.subsidiaryId,
      subsidiaryName: group.subsidiaryName,
      headcount: group.employees.length,
      byDepartment,
      byContractType,
    };
  });

  return {
    total: employees.length,
    bySubsidiary,
  };
}

/**
 * Calculate turnover rate for a given period.
 * Turnover = departures / average headcount over the period.
 */
export async function calculateTurnover(period: {
  start: Date;
  end: Date;
}): Promise<TurnoverMetrics> {
  // Employees active at the start of the period
  const employeesAtStart = await prisma.employee.count({
    where: {
      startDate: { lte: period.start },
      OR: [{ endDate: null }, { endDate: { gt: period.start } }],
    },
  });

  // Employees active at the end of the period
  const employeesAtEnd = await prisma.employee.count({
    where: {
      startDate: { lte: period.end },
      OR: [{ endDate: null }, { endDate: { gt: period.end } }],
    },
  });

  // Departures during the period
  const departures = await prisma.employee.count({
    where: {
      endDate: {
        gte: period.start,
        lte: period.end,
      },
    },
  });

  // Hires during the period
  const hires = await prisma.employee.count({
    where: {
      startDate: {
        gte: period.start,
        lte: period.end,
      },
    },
  });

  const avgHeadcount = (employeesAtStart + employeesAtEnd) / 2;
  const turnoverRate = avgHeadcount > 0 ? departures / avgHeadcount : 0;

  return {
    period,
    totalEmployeesStart: employeesAtStart,
    totalEmployeesEnd: employeesAtEnd,
    departures,
    hires,
    turnoverRate,
  };
}

/**
 * Get recruitment funnel with counts per stage.
 */
export async function getRecruitmentFunnel(): Promise<RecruitmentFunnel> {
  const pipeline = await prisma.recruitmentPipeline.findMany({
    include: { subsidiary: true },
  });

  const statusOrder = [
    "SOURCING",
    "SCREENING",
    "INTERVIEW",
    "OFFER",
    "HIRED",
    "REJECTED",
  ];

  const statusCounts: Record<string, number> = {};
  for (const status of statusOrder) {
    statusCounts[status] = 0;
  }
  for (const entry of pipeline) {
    statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1;
  }

  const total = pipeline.length;

  const stages = statusOrder.map((status) => ({
    status,
    count: statusCounts[status],
    percentage: total > 0 ? statusCounts[status] / total : 0,
  }));

  // Group by subsidiary
  const bySubsidiary: RecruitmentFunnel["bySubsidiary"] = {};
  for (const entry of pipeline) {
    if (!bySubsidiary[entry.subsidiaryId]) {
      bySubsidiary[entry.subsidiaryId] = {
        subsidiaryName: entry.subsidiary.name,
        total: 0,
        stages: {},
      };
    }
    bySubsidiary[entry.subsidiaryId].total += 1;
    bySubsidiary[entry.subsidiaryId].stages[entry.status] =
      (bySubsidiary[entry.subsidiaryId].stages[entry.status] || 0) + 1;
  }

  return { total, stages, bySubsidiary };
}

/**
 * Calculate average cost per hire.
 * Estimation based on average monthly salary of hired candidates and typical recruitment costs.
 */
export async function calculateCostPerHire(): Promise<CostPerHire> {
  const hiredCandidates = await prisma.recruitmentPipeline.findMany({
    where: { status: "HIRED" },
  });

  // Estimate recruitment cost as ~15% of annual salary for the position
  // We approximate with the average salary of recent hires
  const recentHires = await prisma.employee.findMany({
    where: {
      startDate: {
        gte: new Date(new Date().getFullYear(), 0, 1), // Since start of year
      },
    },
  });

  const totalHires = recentHires.length || 1;
  const avgMonthlySalary =
    recentHires.length > 0
      ? recentHires.reduce((sum, e) => sum + e.monthlySalary, 0) /
        recentHires.length
      : 0;

  // Estimated recruitment cost: ~15% of annual salary
  const avgAnnualSalary = avgMonthlySalary * 12;
  const estimatedCostPerHire = avgAnnualSalary * 0.15;
  const totalRecruitmentCost = estimatedCostPerHire * totalHires;

  // Average time to hire: estimate based on pipeline entries
  const allPipeline = await prisma.recruitmentPipeline.findMany({
    where: { status: "HIRED" },
  });

  let averageTimeToHire = 45; // Default estimate: 45 days
  if (allPipeline.length > 0) {
    const totalDays = allPipeline.reduce((sum, p) => {
      const days = Math.round(
        (p.updatedAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    averageTimeToHire = Math.round(totalDays / allPipeline.length);
  }

  return {
    averageCostPerHire: Math.round(estimatedCostPerHire * 100) / 100,
    totalRecruitmentCost: Math.round(totalRecruitmentCost * 100) / 100,
    totalHires,
    averageTimeToHire,
  };
}

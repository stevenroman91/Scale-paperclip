import prisma from "@/lib/db";

/**
 * Financial services for Scale Group HQ
 * Consolidates treasury, P&L, and cash flow across all subsidiaries and bank accounts.
 */

export interface TreasuryConsolidation {
  totalBalance: number;
  currency: string;
  accounts: {
    id: string;
    provider: string;
    accountName: string;
    balance: number;
    currency: string;
    lastSyncAt: Date | null;
  }[];
  byProvider: Record<string, number>;
}

export interface SubsidiaryPnL {
  subsidiaryId: string;
  subsidiaryName: string;
  revenue: number;
  costs: number;
  margin: number;
  marginPercentage: number;
}

export interface CashFlowForecast {
  month: string;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  cumulativeBalance: number;
}

/**
 * Consolidate treasury across all bank accounts.
 * Returns total balance and per-provider breakdown.
 */
export async function consolidateTreasury(): Promise<TreasuryConsolidation> {
  const accounts = await prisma.bankAccount.findMany({
    orderBy: { provider: "asc" },
  });

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const byProvider: Record<string, number> = {};
  for (const account of accounts) {
    byProvider[account.provider] =
      (byProvider[account.provider] || 0) + account.balance;
  }

  return {
    totalBalance,
    currency: "EUR",
    accounts: accounts.map((acc) => ({
      id: acc.id,
      provider: acc.provider,
      accountName: acc.accountName,
      balance: acc.balance,
      currency: acc.currency,
      lastSyncAt: acc.lastSyncAt,
    })),
    byProvider,
  };
}

/**
 * Calculate P&L for a given subsidiary.
 * Uses the subsidiary's monthly revenue and costs plus associated transactions.
 */
export async function calculateSubsidiaryPnL(
  subsidiaryId: string
): Promise<SubsidiaryPnL> {
  const subsidiary = await prisma.subsidiary.findUniqueOrThrow({
    where: { id: subsidiaryId },
  });

  const revenue = subsidiary.monthlyRevenue;
  const costs = subsidiary.monthlyCosts;
  const margin = revenue - costs;
  const marginPercentage = revenue > 0 ? margin / revenue : 0;

  return {
    subsidiaryId: subsidiary.id,
    subsidiaryName: subsidiary.name,
    revenue,
    costs,
    margin,
    marginPercentage,
  };
}

/**
 * Generate a cash flow forecast for the specified number of months.
 * Uses current treasury balance and average monthly transaction patterns.
 */
export async function generateCashFlowForecast(
  months: number
): Promise<CashFlowForecast[]> {
  const treasury = await consolidateTreasury();
  const subsidiaries = await prisma.subsidiary.findMany();

  // Aggregate monthly revenue and costs from all subsidiaries
  const totalMonthlyRevenue = subsidiaries.reduce(
    (sum, s) => sum + s.monthlyRevenue,
    0
  );
  const totalMonthlyCosts = subsidiaries.reduce(
    (sum, s) => sum + s.monthlyCosts,
    0
  );

  // Calculate average transaction-based inflows/outflows from last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentTransactions = await prisma.transaction.findMany({
    where: { date: { gte: threeMonthsAgo } },
  });

  const totalInflow = recentTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOutflow = recentTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Monthly average from transactions (fallback to subsidiary data)
  const avgMonthlyInflow =
    recentTransactions.length > 0 ? totalInflow / 3 : totalMonthlyRevenue;
  const avgMonthlyOutflow =
    recentTransactions.length > 0 ? totalOutflow / 3 : totalMonthlyCosts;

  const forecast: CashFlowForecast[] = [];
  let cumulativeBalance = treasury.totalBalance;
  const now = new Date();

  for (let i = 1; i <= months; i++) {
    const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = forecastDate.toISOString().slice(0, 7); // YYYY-MM

    const netCashFlow = avgMonthlyInflow - avgMonthlyOutflow;
    cumulativeBalance += netCashFlow;

    forecast.push({
      month: monthLabel,
      projectedInflow: Math.round(avgMonthlyInflow * 100) / 100,
      projectedOutflow: Math.round(avgMonthlyOutflow * 100) / 100,
      netCashFlow: Math.round(netCashFlow * 100) / 100,
      cumulativeBalance: Math.round(cumulativeBalance * 100) / 100,
    });
  }

  return forecast;
}

/**
 * Get consolidated P&L across all subsidiaries.
 */
export async function getConsolidatedPnL(): Promise<{
  subsidiaries: SubsidiaryPnL[];
  totalRevenue: number;
  totalCosts: number;
  totalMargin: number;
}> {
  const subsidiaries = await prisma.subsidiary.findMany();

  const pnls: SubsidiaryPnL[] = subsidiaries.map((s) => {
    const margin = s.monthlyRevenue - s.monthlyCosts;
    return {
      subsidiaryId: s.id,
      subsidiaryName: s.name,
      revenue: s.monthlyRevenue,
      costs: s.monthlyCosts,
      margin,
      marginPercentage: s.monthlyRevenue > 0 ? margin / s.monthlyRevenue : 0,
    };
  });

  return {
    subsidiaries: pnls,
    totalRevenue: pnls.reduce((sum, p) => sum + p.revenue, 0),
    totalCosts: pnls.reduce((sum, p) => sum + p.costs, 0),
    totalMargin: pnls.reduce((sum, p) => sum + p.margin, 0),
  };
}

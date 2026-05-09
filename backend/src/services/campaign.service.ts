import { Campaign } from '@prisma/client';

export type CampaignWithMetrics = Campaign & {
  grossProfit: number;
  realProfit: number;
  roas: number;
  performanceLabel: string;
  performanceLevel: 'excellent' | 'good' | 'warning' | 'critical';
};

export function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

export function calculateGrossProfit(revenue: number, cost: number): number {
  return roundToTwo(revenue - cost);
}

export function calculateRealProfit(
  revenue: number,
  cost: number,
  fees = 0,
  expenses = 0
): number {
  return roundToTwo(revenue - cost - fees - expenses);
}

export function calculateRoas(revenue: number, cost: number): number {
  if (cost <= 0) {
    return 0;
  }

  return roundToTwo(revenue / cost);
}

export function getPerformanceLevel(
  roas: number
): 'excellent' | 'good' | 'warning' | 'critical' {
  if (roas >= 4) {
    return 'excellent';
  }

  if (roas >= 2) {
    return 'good';
  }

  if (roas >= 1) {
    return 'warning';
  }

  return 'critical';
}

export function getPerformanceLabel(roas: number): string {
  if (roas >= 4) {
    return 'Excelente';
  }

  if (roas >= 2) {
    return 'Boa';
  }

  if (roas >= 1) {
    return 'Atenção';
  }

  return 'Crítica';
}

export function attachCampaignMetrics(campaign: Campaign): CampaignWithMetrics {
  const grossProfit = calculateGrossProfit(campaign.revenue, campaign.cost);

  const realProfit = calculateRealProfit(
    campaign.revenue,
    campaign.cost,
    campaign.fees,
    campaign.expenses
  );

  const roas = calculateRoas(campaign.revenue, campaign.cost);

  return {
    ...campaign,
    grossProfit,
    realProfit,
    roas,
    performanceLabel: getPerformanceLabel(roas),
    performanceLevel: getPerformanceLevel(roas),
  };
}

export function attachCampaignsMetrics(
  campaigns: Campaign[]
): CampaignWithMetrics[] {
  return campaigns.map((campaign) => attachCampaignMetrics(campaign));
}

import { Campaign } from '@prisma/client';

export type CampaignWithMetrics = Campaign & {
  grossProfit: number;
  realProfit: number;
  roas: number;
};

export function calculateGrossProfit(revenue: number, cost: number) {
  return revenue - cost;
}

export function calculateRealProfit(
  revenue: number,
  cost: number,
  fees = 0,
  expenses = 0
) {
  return revenue - cost - fees - expenses;
}

export function calculateRoas(revenue: number, cost: number) {
  if (cost <= 0) {
    return 0;
  }

  return revenue / cost;
}

export function attachCampaignMetrics(campaign: Campaign): CampaignWithMetrics {
  return {
    ...campaign,
    grossProfit: calculateGrossProfit(campaign.revenue, campaign.cost),
    realProfit: calculateRealProfit(
      campaign.revenue,
      campaign.cost,
      campaign.fees,
      campaign.expenses
    ),
    roas: calculateRoas(campaign.revenue, campaign.cost),
  };
}

export function attachCampaignsMetrics(
  campaigns: Campaign[]
): CampaignWithMetrics[] {
  return campaigns.map(attachCampaignMetrics);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateGrossProfit = calculateGrossProfit;
exports.calculateRealProfit = calculateRealProfit;
exports.calculateRoas = calculateRoas;
exports.attachCampaignMetrics = attachCampaignMetrics;
exports.attachCampaignsMetrics = attachCampaignsMetrics;
function calculateGrossProfit(revenue, cost) {
    return revenue - cost;
}
function calculateRealProfit(revenue, cost, fees = 0, expenses = 0) {
    return revenue - cost - fees - expenses;
}
function calculateRoas(revenue, cost) {
    if (cost <= 0) {
        return 0;
    }
    return revenue / cost;
}
function attachCampaignMetrics(campaign) {
    return {
        ...campaign,
        grossProfit: calculateGrossProfit(campaign.revenue, campaign.cost),
        realProfit: calculateRealProfit(campaign.revenue, campaign.cost, campaign.fees, campaign.expenses),
        roas: calculateRoas(campaign.revenue, campaign.cost),
    };
}
function attachCampaignsMetrics(campaigns) {
    return campaigns.map(attachCampaignMetrics);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const campaign_schema_1 = require("../schemas/campaign.schema");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const campaign_service_1 = require("../services/campaign.service");
const campaignRoutes = (0, express_1.Router)();
exports.campaignRoutes = campaignRoutes;
const querySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(50).default(10),
    search: zod_1.z.string().trim().optional().default(''),
    sortBy: zod_1.z
        .enum([
        'name',
        'cost',
        'revenue',
        'createdAt',
        'grossProfit',
        'realProfit',
        'roas',
    ])
        .optional()
        .default('createdAt'),
    order: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
campaignRoutes.use(auth_middleware_1.authMiddleware);
campaignRoutes.post('/', async (req, res) => {
    try {
        const data = campaign_schema_1.campaignSchema.parse(req.body);
        const campaign = await prisma_1.prisma.campaign.create({
            data: {
                name: data.name,
                cost: data.cost,
                revenue: data.revenue,
                fees: data.fees,
                expenses: data.expenses,
                userId: req.userId,
            },
        });
        return res.status(201).json((0, campaign_service_1.attachCampaignMetrics)(campaign));
    }
    catch (error) {
        console.error('CREATE_CAMPAIGN_ERROR:', error);
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                message: 'Erro de validacao',
                errors: error.issues,
            });
        }
        return res.status(500).json({
            message: 'Erro interno no servidor',
        });
    }
});
campaignRoutes.get('/', async (req, res) => {
    try {
        const { page, limit, search, sortBy, order } = querySchema.parse(req.query);
        const skip = (page - 1) * limit;
        const where = {
            userId: req.userId,
            ...(search
                ? {
                    name: {
                        contains: search,
                    },
                }
                : {}),
        };
        const canSortDirectly = ['name', 'cost', 'revenue', 'createdAt'].includes(sortBy);
        const [campaigns, totalItems] = await Promise.all([
            prisma_1.prisma.campaign.findMany({
                where,
                orderBy: canSortDirectly
                    ? {
                        [sortBy]: order,
                    }
                    : {
                        createdAt: 'desc',
                    },
                skip,
                take: limit,
            }),
            prisma_1.prisma.campaign.count({
                where,
            }),
        ]);
        let campaignsWithMetrics = (0, campaign_service_1.attachCampaignsMetrics)(campaigns);
        if (sortBy === 'grossProfit') {
            campaignsWithMetrics = campaignsWithMetrics.sort((a, b) => order === 'asc'
                ? a.grossProfit - b.grossProfit
                : b.grossProfit - a.grossProfit);
        }
        if (sortBy === 'realProfit') {
            campaignsWithMetrics = campaignsWithMetrics.sort((a, b) => order === 'asc'
                ? a.realProfit - b.realProfit
                : b.realProfit - a.realProfit);
        }
        if (sortBy === 'roas') {
            campaignsWithMetrics = campaignsWithMetrics.sort((a, b) => order === 'asc' ? a.roas - b.roas : b.roas - a.roas);
        }
        const totalPages = Math.ceil(totalItems / limit);
        return res.json({
            data: campaignsWithMetrics,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
            filters: {
                search,
                sortBy,
                order,
            },
        });
    }
    catch (error) {
        console.error('LIST_CAMPAIGNS_ERROR:', error);
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                message: 'Erro de validacao',
                errors: error.issues,
            });
        }
        return res.status(500).json({
            message: 'Erro interno no servidor',
        });
    }
});
campaignRoutes.delete('/:id', async (req, res) => {
    try {
        const paramId = req.params.id;
        const id = Array.isArray(paramId) ? paramId[0] : paramId;
        if (!id) {
            return res.status(400).json({
                message: 'ID da campanha nao informado',
            });
        }
        const campaign = await prisma_1.prisma.campaign.findFirst({
            where: {
                id,
                userId: req.userId,
            },
        });
        if (!campaign) {
            return res.status(404).json({
                message: 'Campanha nao encontrada',
            });
        }
        await prisma_1.prisma.campaign.delete({
            where: {
                id: campaign.id,
            },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error('DELETE_CAMPAIGN_ERROR:', error);
        return res.status(500).json({
            message: 'Erro interno no servidor',
        });
    }
});

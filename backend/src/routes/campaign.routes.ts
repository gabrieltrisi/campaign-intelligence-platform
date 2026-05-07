import { Router } from 'express';
import { z, ZodError } from 'zod';

import { prisma } from '../utils/prisma';
import { campaignSchema } from '../schemas/campaign.schema';

import {
  authMiddleware,
  AuthenticatedRequest,
} from '../middlewares/auth.middleware';

import {
  attachCampaignMetrics,
  attachCampaignsMetrics,
} from '../services/campaign.service';

const campaignRoutes = Router();

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().trim().optional().default(''),
  sortBy: z
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
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

campaignRoutes.use(authMiddleware);

campaignRoutes.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const data = campaignSchema.parse(req.body);

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        cost: data.cost,
        revenue: data.revenue,
        fees: data.fees,
        expenses: data.expenses,
        userId: req.userId as string,
      },
    });

    return res.status(201).json(attachCampaignMetrics(campaign));
  } catch (error) {
    console.error('CREATE_CAMPAIGN_ERROR:', error);

    if (error instanceof ZodError) {
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

campaignRoutes.get('/', async (req: AuthenticatedRequest, res) => {
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

    const canSortDirectly = ['name', 'cost', 'revenue', 'createdAt'].includes(
      sortBy
    );

    const [campaigns, totalItems] = await Promise.all([
      prisma.campaign.findMany({
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

      prisma.campaign.count({
        where,
      }),
    ]);

    let campaignsWithMetrics = attachCampaignsMetrics(campaigns);

    if (sortBy === 'grossProfit') {
      campaignsWithMetrics = campaignsWithMetrics.sort((a, b) =>
        order === 'asc'
          ? a.grossProfit - b.grossProfit
          : b.grossProfit - a.grossProfit
      );
    }

    if (sortBy === 'realProfit') {
      campaignsWithMetrics = campaignsWithMetrics.sort((a, b) =>
        order === 'asc'
          ? a.realProfit - b.realProfit
          : b.realProfit - a.realProfit
      );
    }

    if (sortBy === 'roas') {
      campaignsWithMetrics = campaignsWithMetrics.sort((a, b) =>
        order === 'asc' ? a.roas - b.roas : b.roas - a.roas
      );
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
  } catch (error) {
    console.error('LIST_CAMPAIGNS_ERROR:', error);

    if (error instanceof ZodError) {
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

campaignRoutes.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const paramId = req.params.id;
    const id = Array.isArray(paramId) ? paramId[0] : paramId;

    if (!id) {
      return res.status(400).json({
        message: 'ID da campanha nao informado',
      });
    }

    const campaign = await prisma.campaign.findFirst({
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

    await prisma.campaign.delete({
      where: {
        id: campaign.id,
      },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('DELETE_CAMPAIGN_ERROR:', error);

    return res.status(500).json({
      message: 'Erro interno no servidor',
    });
  }
});

export { campaignRoutes };

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

function formatZodError(error: ZodError) {
  return {
    message: 'Erro de validacao',
    errors: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

function sortCampaignsWithMetrics<T extends Record<string, unknown>>(
  campaigns: T[],
  sortBy: string,
  order: 'asc' | 'desc'
) {
  return [...campaigns].sort((a, b) => {
    const firstValue = a[sortBy];
    const secondValue = b[sortBy];

    if (typeof firstValue === 'string' && typeof secondValue === 'string') {
      return order === 'asc'
        ? firstValue.localeCompare(secondValue)
        : secondValue.localeCompare(firstValue);
    }

    if (typeof firstValue === 'number' && typeof secondValue === 'number') {
      return order === 'asc'
        ? firstValue - secondValue
        : secondValue - firstValue;
    }

    return 0;
  });
}

campaignRoutes.use(authMiddleware);

campaignRoutes.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: 'Usuario nao autenticado',
      });
    }

    const data = campaignSchema.parse(req.body);

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        cost: data.cost,
        revenue: data.revenue,
        fees: data.fees ?? 0,
        expenses: data.expenses ?? 0,
        userId: req.userId,
      },
    });

    const campaignWithMetrics = attachCampaignMetrics(campaign);

    return res.status(201).json({
      message: 'Campanha criada com sucesso',
      data: campaignWithMetrics,
    });
  } catch (error) {
    console.error('CREATE_CAMPAIGN_ERROR:', error);

    if (error instanceof ZodError) {
      return res.status(400).json(formatZodError(error));
    }

    return res.status(500).json({
      message: 'Erro interno no servidor',
    });
  }
});

campaignRoutes.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: 'Usuario nao autenticado',
      });
    }

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

    const calculatedSortFields = ['grossProfit', 'realProfit', 'roas'];
    const isCalculatedSort = calculatedSortFields.includes(sortBy);

    const canSortDirectly = ['name', 'cost', 'revenue', 'createdAt'].includes(
      sortBy
    );

    const totalItems = await prisma.campaign.count({
      where,
    });

    let campaignsWithMetrics = [];

    if (isCalculatedSort) {
      const allCampaigns = await prisma.campaign.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const allCampaignsWithMetrics = attachCampaignsMetrics(allCampaigns);

      const sortedCampaigns = sortCampaignsWithMetrics(
        allCampaignsWithMetrics,
        sortBy,
        order
      );

      campaignsWithMetrics = sortedCampaigns.slice(skip, skip + limit);
    } else {
      const campaigns = await prisma.campaign.findMany({
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
      });

      campaignsWithMetrics = attachCampaignsMetrics(campaigns);
    }

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      message: 'Campanhas listadas com sucesso',
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
      return res.status(400).json(formatZodError(error));
    }

    return res.status(500).json({
      message: 'Erro interno no servidor',
    });
  }
});

campaignRoutes.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: 'Usuario nao autenticado',
      });
    }

    const { id } = req.params;

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

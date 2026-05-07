import { z } from 'zod';

export const campaignSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter no minimo 2 caracteres'),

  cost: z.number().positive('Custo deve ser maior que zero'),

  revenue: z.number().nonnegative('Receita nao pode ser negativa'),

  fees: z.number().nonnegative().optional().default(0),

  expenses: z.number().nonnegative().optional().default(0),
});

import { z } from 'zod';

export const campaignSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  cost: z.number().positive('Custo deve ser maior que zero'),

  revenue: z.number().nonnegative('Receita não pode ser negativa'),

  fees: z
    .number()
    .nonnegative('Taxas não podem ser negativas')
    .optional()
    .default(0),

  expenses: z
    .number()
    .nonnegative('Despesas não podem ser negativas')
    .optional()
    .default(0),
});

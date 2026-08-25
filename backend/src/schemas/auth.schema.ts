import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter no minimo 2 caracteres'),

  email: z.string().trim().toLowerCase().email('E-mail invalido'),

  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail invalido'),

  password: z.string().min(1, 'Senha obrigatoria'),
});

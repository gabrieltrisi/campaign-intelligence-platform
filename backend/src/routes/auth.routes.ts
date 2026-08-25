import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';

import { prisma } from '../utils/prisma';

import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { authRateLimiter } from '../middlewares/rate-limit.middleware';

const authRoutes = Router();

authRoutes.use(authRateLimiter);

authRoutes.post('/register', async (req, res) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const userAlreadyExists = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (userAlreadyExists) {
      return res.status(409).json({
        message: 'E-mail ja cadastrado',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },

      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: 'Usuario cadastrado com sucesso',
      user,
    });
  } catch (error) {
    console.error('REGISTER_ERROR:', error);

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

authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        message: 'JWT_SECRET nao configurado',
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: 'Credenciais invalidas',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Credenciais invalidas',
      });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      jwtSecret,
      {
        expiresIn: '1d',
      }
    );

    return res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('LOGIN_ERROR:', error);

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

export { authRoutes };

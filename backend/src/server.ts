import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { prisma } from './utils/prisma';

import { authRoutes } from './routes/auth.routes';
import { campaignRoutes } from './routes/campaign.routes';

import { loggerMiddleware } from './middlewares/logger.middleware';
import { errorMiddleware } from './middlewares/error.middleware';

dotenv.config();

const app = express();

/*
|--------------------------------------------------------------------------
| TRUST PROXY
|--------------------------------------------------------------------------
| Necessário para funcionar corretamente no Render/Vercel
| evitando erro do express-rate-limit com X-Forwarded-For
|--------------------------------------------------------------------------
*/
app.set('trust proxy', 1);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',

      'https://campaign-intelligence-platform.vercel.app',

      'https://campaign-intelligence-platform-roan.vercel.app',

      'https://campaign-intelligence-platform-git-main-gabrieltrisis-projects.vercel.app',

      'https://campaign-intelligence-platform-e4i08sbdk-gabrieltrisis-projects.vercel.app',
    ],

    credentials: true,
  })
);

/*
|--------------------------------------------------------------------------
| MIDDLEWARES
|--------------------------------------------------------------------------
*/
app.use(express.json());

app.use(loggerMiddleware);

/*
|--------------------------------------------------------------------------
| ROOT
|--------------------------------------------------------------------------
*/
app.get('/', (_req, res) => {
  return res.status(200).json({
    status: 'online',
    message: 'Campaign Intelligence API running',
    version: '1.0.0',
  });
});

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: 'healthy',

      database: 'connected',

      uptime: process.uptime(),

      timestamp: new Date().toISOString(),

      version: '1.0.0',
    });
  } catch (error) {
    console.error('HEALTH_CHECK_ERROR:', error);

    return res.status(500).json({
      status: 'unhealthy',

      database: 'disconnected',

      timestamp: new Date().toISOString(),
    });
  }
});

/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/
app.use('/auth', authRoutes);

app.use('/campaigns', campaignRoutes);

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/
app.use(errorMiddleware);

/*
|--------------------------------------------------------------------------
| SERVER
|--------------------------------------------------------------------------
*/
const PORT = process.env.PORT || 3333;

/*
|--------------------------------------------------------------------------
| EXPORT APP
|--------------------------------------------------------------------------
| Necessário para testes automatizados com Vitest/Supertest
|--------------------------------------------------------------------------
*/
export { app };

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
| Evita iniciar servidor durante testes automatizados
|--------------------------------------------------------------------------
*/
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`
========================================
🚀 Server running successfully
📍 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
========================================
    `);
  });
}

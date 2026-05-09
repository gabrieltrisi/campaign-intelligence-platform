import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';

type AppError = Error & {
  statusCode?: number;
  status?: number;
};

function formatZodErrors(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('GLOBAL_ERROR:', error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Erro de validação',
      errors: formatZodErrors(error),
    });
  }

  if (error instanceof jwt.TokenExpiredError) {
    return res.status(401).json({
      message: 'Token expirado',
    });
  }

  if (error instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({
      message: 'Token inválido',
    });
  }

  const appError = error as AppError;

  if (appError.statusCode || appError.status) {
    return res.status(appError.statusCode || appError.status || 500).json({
      message: appError.message || 'Erro na requisição',
    });
  }

  return res.status(500).json({
    message: 'Erro interno no servidor',
  });
}

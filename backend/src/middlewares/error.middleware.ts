import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('GLOBAL_ERROR:', error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Erro de validacao',
      errors: error.issues,
    });
  }

  if (error instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({
      message: 'Token invalido',
    });
  }

  if (error instanceof jwt.TokenExpiredError) {
    return res.status(401).json({
      message: 'Token expirado',
    });
  }

  return res.status(500).json({
    message: 'Erro interno no servidor',
  });
}

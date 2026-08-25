import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload as JsonWebTokenPayload } from 'jsonwebtoken';

interface TokenPayload extends JsonWebTokenPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: 'Token nao informado',
    });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      message: 'Formato de token invalido. Use Authorization: Bearer <token>',
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      message: 'JWT_SECRET nao configurado no servidor',
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as TokenPayload;

    if (!decoded.sub) {
      return res.status(401).json({
        message: 'Token invalido',
      });
    }

    req.userId = decoded.sub;

    return next();
  } catch {
    return res.status(401).json({
      message: 'Token invalido ou expirado',
    });
  }
}

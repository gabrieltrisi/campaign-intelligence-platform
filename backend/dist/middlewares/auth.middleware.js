"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
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
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (!decoded.sub) {
            return res.status(401).json({
                message: 'Token invalido',
            });
        }
        req.userId = decoded.sub;
        return next();
    }
    catch {
        return res.status(401).json({
            message: 'Token invalido ou expirado',
        });
    }
}

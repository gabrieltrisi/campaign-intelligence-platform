"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function errorMiddleware(error, _req, res, _next) {
    console.error('GLOBAL_ERROR:', error);
    if (error instanceof zod_1.ZodError) {
        return res.status(400).json({
            message: 'Erro de validacao',
            errors: error.issues,
        });
    }
    if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
        return res.status(401).json({
            message: 'Token invalido',
        });
    }
    if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
        return res.status(401).json({
            message: 'Token expirado',
        });
    }
    return res.status(500).json({
        message: 'Erro interno no servidor',
    });
}

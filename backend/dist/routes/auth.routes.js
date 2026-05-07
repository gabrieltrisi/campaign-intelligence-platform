"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const auth_schema_1 = require("../schemas/auth.schema");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const authRoutes = (0, express_1.Router)();
exports.authRoutes = authRoutes;
authRoutes.use(rate_limit_middleware_1.authRateLimiter);
authRoutes.post('/register', async (req, res) => {
    try {
        const { name, email, password } = auth_schema_1.registerSchema.parse(req.body);
        const userAlreadyExists = await prisma_1.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (userAlreadyExists) {
            return res.status(409).json({
                message: 'E-mail ja cadastrado',
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
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
    }
    catch (error) {
        console.error('REGISTER_ERROR:', error);
        if (error instanceof zod_1.ZodError) {
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
        const { email, password } = auth_schema_1.loginSchema.parse(req.body);
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({
                message: 'JWT_SECRET nao configurado',
            });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            return res.status(401).json({
                message: 'Credenciais invalidas',
            });
        }
        const passwordMatches = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({
                message: 'Credenciais invalidas',
            });
        }
        const token = jsonwebtoken_1.default.sign({
            sub: user.id,
            email: user.email,
        }, jwtSecret, {
            expiresIn: '1d',
        });
        return res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error('LOGIN_ERROR:', error);
        if (error instanceof zod_1.ZodError) {
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

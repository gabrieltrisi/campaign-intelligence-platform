"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, 'Nome deve ter no minimo 2 caracteres'),
    email: zod_1.z.string().trim().toLowerCase().email('E-mail invalido'),
    password: zod_1.z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email('E-mail invalido'),
    password: zod_1.z.string().min(1, 'Senha obrigatoria'),
});

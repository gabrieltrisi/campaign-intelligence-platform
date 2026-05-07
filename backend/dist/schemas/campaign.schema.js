"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignSchema = void 0;
const zod_1 = require("zod");
exports.campaignSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, 'Nome deve ter no minimo 2 caracteres'),
    cost: zod_1.z.number().positive('Custo deve ser maior que zero'),
    revenue: zod_1.z.number().nonnegative('Receita nao pode ser negativa'),
    fees: zod_1.z.number().nonnegative().optional().default(0),
    expenses: zod_1.z.number().nonnegative().optional().default(0),
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("./utils/prisma");
const auth_routes_1 = require("./routes/auth.routes");
const campaign_routes_1 = require("./routes/campaign.routes");
const logger_middleware_1 = require("./middlewares/logger.middleware");
const error_middleware_1 = require("./middlewares/error.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*',
}));
app.use(express_1.default.json());
app.use(logger_middleware_1.loggerMiddleware);
app.get('/', (_req, res) => {
    return res.status(200).json({
        status: 'online',
        message: 'Campaign Intelligence API running',
        version: '1.0.0',
    });
});
app.get('/health', async (_req, res) => {
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        return res.status(200).json({
            status: 'healthy',
            database: 'connected',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        });
    }
    catch (error) {
        console.error('HEALTH_CHECK_ERROR:', error);
        return res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            timestamp: new Date().toISOString(),
        });
    }
});
app.use('/auth', auth_routes_1.authRoutes);
app.use('/campaigns', campaign_routes_1.campaignRoutes);
app.use(error_middleware_1.errorMiddleware);
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`
========================================
🚀 Server running successfully
📍 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
========================================
  `);
});

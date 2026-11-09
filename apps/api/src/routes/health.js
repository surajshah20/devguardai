import { Router } from 'express';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'devguard-api',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '0.1.0',
  });
});

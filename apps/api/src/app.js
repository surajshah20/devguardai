import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { repositoryRouter } from './routes/repositories.js';
import { reviewRouter } from './routes/reviews.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Basic security and request parsing
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // API Routes
  app.use('/api', healthRouter);
  app.use('/api', repositoryRouter);
  app.use('/api', reviewRouter);

  // 404 & Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { healthRouter } from './routes/health.js';
import { repositoryRouter } from './routes/repositories.js';
import { reviewRouter } from './routes/reviews.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDistPath = path.resolve(__dirname, '../../web/dist');

export function createApp() {
  const app = express();

  // Basic security and request parsing
  app.use(
    helmet({
      contentSecurityPolicy: false, // allow loading local assets and Google fonts
    })
  );
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // API Routes
  app.use('/api', healthRouter);
  app.use('/api', repositoryRouter);
  app.use('/api', reviewRouter);

  // Serve static web build if present
  app.use(express.static(webDistPath));

  // SPA fallback for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(webDistPath, 'index.html'), (err) => {
      if (err) next();
    });
  });

  // 404 & Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[DevGuard API] Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  console.log(`[DevGuard API] Health check available at: http://localhost:${env.PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[DevGuard API] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[DevGuard API] Process terminated.');
  });
});


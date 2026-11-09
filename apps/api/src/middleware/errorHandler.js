import { env } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: {
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
      status: 404,
    },
  });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isProd = env.NODE_ENV === 'production';

  const response = {
    error: {
      message: err.message || 'Internal Server Error',
      status,
      ...(isProd ? {} : { stack: err.stack }),
      ...(err.details ? { details: err.details } : {}),
    },
  };

  // Safe logging: avoid dumping full req objects that might contain headers/tokens
  console.error(`[Error] ${req.method} ${req.originalUrl} - ${status}: ${err.message}`);

  res.status(status).json(response);
}

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { healthRouter } from '../src/routes/health.js';
import { notFoundHandler } from '../src/middleware/errorHandler.js';

describe('Health Check Route & Middleware', () => {
  test('GET /health returns 200 with status "ok"', () => {
    let statusCode;
    let jsonResponse;

    const req = { method: 'GET', url: '/health' };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
        return this;
      },
    };

    healthRouter(req, res, () => {});

    assert.equal(statusCode, 200);
    assert.equal(jsonResponse.status, 'ok');
    assert.equal(jsonResponse.service, 'devguard-api');
    assert.equal(typeof jsonResponse.uptime, 'number');
    assert.ok(jsonResponse.timestamp);
    assert.equal(jsonResponse.version, '0.1.0');
  });

  test('notFoundHandler returns 404 payload', () => {
    let statusCode;
    let jsonResponse;

    const req = { method: 'GET', originalUrl: '/unknown-route' };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
        return this;
      },
    };

    notFoundHandler(req, res, () => {});

    assert.equal(statusCode, 404);
    assert.equal(jsonResponse.error.status, 404);
    assert.ok(jsonResponse.error.message.includes('/unknown-route'));
  });
});

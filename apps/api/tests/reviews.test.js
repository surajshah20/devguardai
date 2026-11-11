import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { reviewRouter } from '../src/routes/reviews.js';
import { reviewStore } from '../src/services/storage/reviewStore.js';

describe('Review Router Endpoints', () => {
  test('returns 400 when owner or repo is missing', async () => {
    let responseStatus;
    let responseBody;

    const req = {
      body: { owner: 'test-owner' },
      headers: {},
    };

    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    const postHandler = reviewRouter.stack.find((layer) => layer.route?.path === '/reviews' && layer.route.methods.post)?.route.stack[0].handle;
    assert.ok(postHandler, 'POST /reviews handler found');

    await postHandler(req, res, () => {});

    assert.equal(responseStatus, 400);
    assert.ok(responseBody.error.message.includes('required'));
  });

  test('GET /reviews/:reviewId returns 404 for unknown review ID', async () => {
    let responseStatus;
    let responseBody;

    const req = {
      params: { reviewId: 'non-existent-id' },
    };

    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    const getHandler = reviewRouter.stack.find((layer) => layer.route?.path === '/reviews/:reviewId' && layer.route.methods.get)?.route.stack[0].handle;
    assert.ok(getHandler, 'GET /reviews/:reviewId handler found');

    await getHandler(req, res, () => {});

    assert.equal(responseStatus, 404);
  });

  test('GET /reviews/:reviewId/report returns Markdown attachment', async () => {
    const saved = await reviewStore.saveReview({
      id: 'rev_test_123',
      repository: { fullName: 'test/repo' },
      markdownReport: '# Test Report Content',
      summary: { total: 0 },
      findings: [],
    });

    let headers = {};
    let sentData;

    const req = {
      params: { reviewId: saved.id },
      query: { format: 'markdown' },
    };

    const res = {
      setHeader(key, val) {
        headers[key] = val;
      },
      send(data) {
        sentData = data;
      },
    };

    const reportHandler = reviewRouter.stack.find((layer) => layer.route?.path === '/reviews/:reviewId/report' && layer.route.methods.get)?.route.stack[0].handle;
    assert.ok(reportHandler, 'GET /reviews/:reviewId/report handler found');

    await reportHandler(req, res, () => {});

    assert.equal(sentData, '# Test Report Content');
    assert.ok(headers['Content-Disposition'].includes('devguard-report-rev_test_123.md'));
  });
});

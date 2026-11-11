import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { reviewRouter } from '../src/routes/reviews.js';

describe('Review Router Endpoints', () => {
  test('returns 400 when owner or repo is missing', async () => {
    let responseStatus;
    let responseBody;

    const req = {
      body: { owner: 'test-owner' }, // missing repo
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

    const postHandler = reviewRouter.stack.find((layer) => layer.route?.path === '/reviews')?.route.stack[0].handle;
    assert.ok(postHandler, 'POST /reviews handler found');

    await postHandler(req, res, () => {});

    assert.equal(responseStatus, 400);
    assert.ok(responseBody.error.message.includes('required'));
  });
});

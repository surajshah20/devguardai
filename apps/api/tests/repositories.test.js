import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { repositoryRouter } from '../src/routes/repositories.js';

describe('Repository Router Endpoints', () => {
  test('handles route parameter validation and error dispatch', async () => {
    let capturedError;
    const req = {
      params: { owner: 'non-existent-owner-12345', repo: 'non-existent-repo-98765' },
      query: {},
      headers: {},
    };
    const res = {};
    const next = (err) => {
      capturedError = err;
    };

    // Invoke the GET handler
    const getHandler = repositoryRouter.stack.find((layer) => layer.route?.path === '/repositories/:owner/:repo')?.route.stack[0].handle;
    assert.ok(getHandler, 'GET /repositories/:owner/:repo handler found');

    await getHandler(req, res, next);
    assert.ok(capturedError, 'Dispatched error to next() on network or not-found');
  });
});


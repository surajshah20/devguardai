import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { runAIReview } from '../src/services/ai/aiReviewer.js';

describe('AI Reviewer Service', () => {
  test('returns graceful error message if provider is not configured or fails', async () => {
    // When no API key is provided and provider is gemini
    const result = await runAIReview({
      files: [{ path: 'app.js', content: 'console.log(1);' }],
      findings: [],
      project: {},
      options: { provider: 'gemini', apiKey: '' },
    });

    assert.ok(result.error);
    assert.equal(result.aiFindings.length, 0);
  });

  test('returns empty findings when file list is empty', async () => {
    const result = await runAIReview({
      files: [],
      findings: [],
      project: {},
    });

    assert.deepEqual(result.aiFindings, []);
  });
});

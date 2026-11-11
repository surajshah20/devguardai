import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { reviewStore } from '../src/services/storage/reviewStore.js';

describe('Review Store Service', () => {
  beforeEach(() => {
    reviewStore.clear();
  });

  test('saves and retrieves review record by reviewId', async () => {
    const saved = await reviewStore.saveReview({
      repository: { fullName: 'user/repo' },
      commitSha: 'commit123',
      findings: [],
    });

    assert.ok(saved.id);
    assert.ok(saved.createdAt);

    const fetched = await reviewStore.getReviewById(saved.id);
    assert.equal(fetched.id, saved.id);
    assert.equal(fetched.commitSha, 'commit123');
  });

  test('returns null for non-existent review ID', async () => {
    const res = await reviewStore.getReviewById('non-existent');
    assert.equal(res, null);
  });

  test('lists stored reviews ordered by recency', async () => {
    await reviewStore.saveReview({ commitSha: 'c1' });
    await reviewStore.saveReview({ commitSha: 'c2' });

    const list = await reviewStore.listReviews(10);
    assert.equal(list.length, 2);
  });
});

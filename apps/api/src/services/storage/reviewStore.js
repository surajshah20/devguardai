import { randomUUID } from 'node:crypto';

// In-memory registry of completed review runs
const reviewCache = new Map();

export const reviewStore = {
  /**
   * Saves a new review run.
   * @param {object} reviewData
   * @returns {object} Stored review record with generated reviewId
   */
  async saveReview(reviewData) {
    const reviewId = reviewData.id || `rev_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const record = {
      id: reviewId,
      createdAt: new Date().toISOString(),
      ...reviewData,
    };

    reviewCache.set(reviewId, record);
    return record;
  },

  /**
   * Retrieves a review by its ID.
   * @param {string} reviewId
   * @returns {object | null}
   */
  async getReviewById(reviewId) {
    return reviewCache.get(reviewId) || null;
  },

  /**
   * Lists all stored reviews (most recent first).
   * @param {number} [limit=20]
   * @returns {Array<object>}
   */
  async listReviews(limit = 20) {
    const all = Array.from(reviewCache.values());
    return all
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  /**
   * Clears the store (used in testing).
   */
  clear() {
    reviewCache.clear();
  },
};

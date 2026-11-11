/**
 * Base AI Provider interface definition.
 */
export class BaseAIProvider {
  /**
   * @param {object} config
   * @param {string} config.model
   * @param {number} [config.timeoutMs]
   */
  constructor({ model, timeoutMs = 30000 }) {
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Generates completion for a prompt.
   * @param {string} prompt
   * @returns {Promise<string>} Raw text output from model
   */
  async generateCompletion(prompt) {
    throw new Error('generateCompletion() must be implemented by subclass');
  }
}

import { BaseAIProvider } from './aiProvider.js';

export class OllamaProvider extends BaseAIProvider {
  /**
   * @param {object} [config]
   * @param {string} [config.baseUrl]
   * @param {string} [config.model]
   * @param {number} [config.timeoutMs]
   */
  constructor({ baseUrl = 'http://localhost:11434', model = 'llama3', timeoutMs = 60000 } = {}) {
    super({ model, timeoutMs });
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.name = 'ollama';
  }

  async generateCompletion(prompt) {
    const endpoint = `${this.baseUrl}/api/generate`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    timer.unref?.();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          prompt,
          format: 'json',
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Ollama returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`Ollama request timed out after ${this.timeoutMs}ms`);
      }
      if (err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Ollama at ${this.baseUrl}. Ensure Ollama is running ('ollama serve').`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}


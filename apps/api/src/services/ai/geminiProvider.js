import { BaseAIProvider } from './aiProvider.js';

export class GeminiProvider extends BaseAIProvider {
  /**
   * @param {object} config
   * @param {string} config.apiKey
   * @param {string} [config.model]
   * @param {number} [config.timeoutMs]
   */
  constructor({ apiKey, model = 'gemini-2.5-flash', timeoutMs = 30000 } = {}) {
    super({ model, timeoutMs });
    this.apiKey = apiKey;
    this.name = 'gemini';
  }

  async generateCompletion(prompt) {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured. Set AI_API_KEY in your environment or .env file.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.model
    )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    timer.unref?.();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        if (response.status === 400 || response.status === 403) {
          throw new Error(`Gemini authentication error (${response.status}): Check your AI_API_KEY.`);
        }
        if (response.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please wait or switch to Ollama.');
        }
        throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Empty response received from Gemini model.');
      }

      return text;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`Gemini request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}


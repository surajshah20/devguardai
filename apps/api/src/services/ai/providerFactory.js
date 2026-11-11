import { GeminiProvider } from './geminiProvider.js';
import { OllamaProvider } from './ollamaProvider.js';
import { env } from '../../config/env.js';

/**
 * Returns an instance of the configured AI provider.
 *
 * @param {object} [overrides]
 * @param {'gemini' | 'ollama'} [overrides.provider]
 * @param {string} [overrides.apiKey]
 * @param {string} [overrides.model]
 * @param {string} [overrides.baseUrl]
 * @returns {GeminiProvider | OllamaProvider}
 */
export function getAIProvider(overrides = {}) {
  const providerType = overrides.provider || env.AI_PROVIDER || 'gemini';

  if (providerType === 'gemini') {
    return new GeminiProvider({
      apiKey: overrides.apiKey || env.AI_API_KEY,
      model: overrides.model || env.AI_MODEL || 'gemini-2.5-flash',
    });
  }

  if (providerType === 'ollama') {
    return new OllamaProvider({
      baseUrl: overrides.baseUrl || env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: overrides.model || env.AI_MODEL || 'llama3',
    });
  }

  throw new Error(`Unsupported AI provider: ${providerType}. Must be 'gemini' or 'ollama'.`);
}

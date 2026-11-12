import { buildReviewPrompt } from './promptBuilder.js';
import { getAIProvider } from './providerFactory.js';
import { FindingListSchema } from '../../validators/findingSchema.js';

/**
 * Runs an AI-assisted code review over repository files and deterministic findings.
 *
 * @param {object} params
 * @param {Array<object>} params.files - Permitted repository source files
 * @param {Array<object>} params.findings - Existing deterministic findings
 * @param {object} params.project - Detected project metadata
 * @param {object} [params.options] - Custom provider overrides or settings
 * @returns {Promise<{ aiFindings: Array<object>, error?: string }>}
 */
export async function runAIReview({ files = [], findings = [], project = {}, options = {} }) {
  let provider;

  try {
    provider = getAIProvider(options);
  } catch (err) {
    return {
      aiFindings: [],
      error: `AI provider initialization failed: ${err.message}`,
    };
  }

  // If no files to review, return early
  if (files.length === 0) {
    return { aiFindings: [] };
  }

  try {
    const prompt = buildReviewPrompt({ project, findings, files });
    const rawResponse = await provider.generateCompletion(prompt);

    // Extract JSON payload (handling possible markdown ```json ... ``` wrapper)
    let jsonString = rawResponse.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7);
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.slice(0, -3);
    }
    jsonString = jsonString.trim();

    const parsedJson = JSON.parse(jsonString);

    if (!Array.isArray(parsedJson)) {
      return {
        aiFindings: [],
        error: 'AI response was not a JSON array.',
      };
    }

    // Tag all AI findings strictly with source "ai" and status "unverified"
    const sanitizedFindings = parsedJson.map((item) => ({
      ...item,
      source: 'ai',
      verificationStatus: 'unverified',
    }));

    // Validate schema with Zod
    const validated = FindingListSchema.safeParse(sanitizedFindings);

    if (!validated.success) {
      console.warn('[AI Reviewer] Schema validation failed for some AI findings:', validated.error.issues);
      // Filter out invalid items, keeping only valid ones
      const validItems = sanitizedFindings.filter((item) => {
        return FindingListSchema.element.safeParse(item).success;
      });
      return { aiFindings: validItems };
    }

    return { aiFindings: validated.data };
  } catch (err) {
    console.warn(`[AI Reviewer] AI analysis skipped due to error: ${err.message}`);
    return {
      aiFindings: [],
      error: `AI review could not be completed: ${err.message}`,
    };
  }
}


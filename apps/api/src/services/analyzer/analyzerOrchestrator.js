import { detectProjectType } from './projectDetector.js';
import { analyzePatterns } from './patternAnalyzer.js';
import { analyzeWithESLint } from './eslintAnalyzer.js';
import { deduplicateFindings } from './findingDeduplicator.js';
import { FindingListSchema } from '../../validators/findingSchema.js';

export const DEFAULT_ANALYSIS_OPTIONS = {
  timeoutMs: 15000,
  enableESLint: true,
  enableSecurityRules: true,
};

/**
 * Runs deterministic static analysis on repository files with timeout protection.
 *
 * @param {Array<{ path: string, content: string }>} files
 * @param {typeof DEFAULT_ANALYSIS_OPTIONS} [options]
 * @returns {Promise<object>} Complete static analysis report
 */
export async function runStaticAnalysis(files = [], options = {}) {
  const opts = { ...DEFAULT_ANALYSIS_OPTIONS, ...options };
  const startTime = Date.now();

  if (opts.timeoutMs <= 0) {
    throw new Error(`Static analysis timed out after ${opts.timeoutMs}ms`);
  }

  const analysisPromise = (async () => {
    // 1. Detect project type and ecosystem
    const project = detectProjectType(files);

    const rawFindings = [];

    // 2. Run deterministic security rules
    if (opts.enableSecurityRules) {
      const patternFindings = analyzePatterns(files);
      rawFindings.push(...patternFindings);
    }

    // 3. Run ESLint if JavaScript/TypeScript ecosystem
    if (opts.enableESLint && (project.ecosystem === 'node' || project.languages.includes('javascript') || project.languages.includes('typescript'))) {
      const eslintFindings = analyzeWithESLint(files);
      rawFindings.push(...eslintFindings);
    }

    // 4. Deduplicate overlapping findings and sort by severity
    const deduplicated = deduplicateFindings(rawFindings);

    // 5. Validate compliant schema structure
    const validatedFindings = FindingListSchema.parse(deduplicated);

    // 6. Calculate summary breakdown
    const summary = {
      total: validatedFindings.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    for (const f of validatedFindings) {
      if (summary[f.severity] !== undefined) {
        summary[f.severity]++;
      }
    }

    return {
      project,
      summary,
      findings: validatedFindings,
      durationMs: Date.now() - startTime,
    };
  })();

  // Timeout guard
  const timeoutPromise = new Promise((_, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Static analysis timed out after ${opts.timeoutMs}ms`));
    }, opts.timeoutMs);
    timer.unref?.();
  });

  return Promise.race([analysisPromise, timeoutPromise]);
}

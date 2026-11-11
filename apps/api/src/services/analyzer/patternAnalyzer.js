import path from 'node:path';
import { SECURITY_RULES } from './rules/securityRules.js';

/**
 * Runs deterministic security and anti-pattern rules across source files.
 *
 * @param {Array<{ path: string, content: string }>} files
 * @param {object} [options]
 * @param {Array<object>} [options.rules] - Custom rule set to override default SECURITY_RULES
 * @returns {Array<object>} List of standardized findings
 */
export function analyzePatterns(files = [], options = {}) {
  const rules = options.rules || SECURITY_RULES;
  const findings = [];

  for (const file of files) {
    if (!file.content || typeof file.content !== 'string') continue;

    const ext = path.extname(file.path).toLowerCase();
    const lines = file.content.split('\n');

    for (const rule of rules) {
      if (rule.extensions && !rule.extensions.includes(ext)) {
        continue;
      }

      // Reset regex state if global flag is present
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);

      // Line-by-line scanning to pinpoint exact startLine and endLine
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        regex.lastIndex = 0;

        if (regex.test(lineText)) {
          findings.push({
            title: rule.title,
            severity: rule.severity,
            confidence: rule.confidence,
            source: 'semgrep',
            ruleId: rule.id,
            filePath: file.path,
            startLine: i + 1,
            endLine: i + 1,
            evidence: lineText.trim(),
            explanation: rule.explanation,
            suggestedFix: rule.suggestedFix,
            verificationStatus: 'verified',
          });
        }
      }
    }
  }

  return findings;
}


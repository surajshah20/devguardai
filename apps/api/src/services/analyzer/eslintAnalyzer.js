import { Linter } from 'eslint';
import path from 'node:path';

const linter = new Linter();

const DEFAULT_ESLINT_CONFIG = {
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-debugger': 'error',
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-unused-vars': 'warn',
    'no-constant-condition': 'warn',
    'no-prototype-builtins': 'warn',
    'eqeqeq': ['warn', 'smart'],
    'no-var': 'warn',
  },
};

const JS_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.jsx']);

/**
 * Maps ESLint severity levels and rule IDs to DevGuard finding severities.
 */
function mapSeverity(msg) {
  if (!msg.ruleId) return 'critical'; // Parsing/syntax errors prevent execution
  if (['no-eval', 'no-implied-eval'].includes(msg.ruleId)) return 'critical';
  if (msg.severity === 2) return 'high';
  if (['no-unused-vars', 'no-constant-condition', 'eqeqeq'].includes(msg.ruleId)) return 'low';
  return 'medium';
}

/**
 * Analyzes JavaScript files using the ESLint Linter engine in memory.
 *
 * @param {Array<{ path: string, content: string }>} files
 * @param {object} [config] - Optional custom ESLint configuration
 * @returns {Array<object>} Standardized finding objects
 */
export function analyzeWithESLint(files = [], config = DEFAULT_ESLINT_CONFIG) {
  const findings = [];

  for (const file of files) {
    if (!file.content || typeof file.content !== 'string') continue;

    const ext = path.extname(file.path).toLowerCase();
    if (!JS_EXTENSIONS.has(ext)) continue;

    try {
      const messages = linter.verify(file.content, config);
      const lines = file.content.split('\n');

      for (const msg of messages) {
        const lineNum = msg.line || 1;
        const lineText = lines[lineNum - 1] ? lines[lineNum - 1].trim() : '';

        findings.push({
          title: msg.ruleId ? `ESLint: ${msg.ruleId}` : 'Syntax or Parsing Error',
          severity: mapSeverity(msg),
          confidence: 'high',
          source: 'eslint',
          ruleId: msg.ruleId || 'syntax-error',
          filePath: file.path,
          startLine: lineNum,
          endLine: msg.endLine || lineNum,
          evidence: lineText,
          explanation: msg.message,
          suggestedFix: msg.fix ? 'Fix can be applied automatically with linter' : undefined,
          verificationStatus: 'verified',
        });
      }
    } catch {
      // Fallback if parsing fails catastrophically
    }
  }

  return findings;
}

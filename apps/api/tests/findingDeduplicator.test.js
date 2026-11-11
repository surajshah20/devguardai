import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deduplicateFindings } from '../src/services/analyzer/findingDeduplicator.js';

describe('Finding Deduplicator Service', () => {
  test('deduplicates equivalent findings on the same line prioritizing higher severity', () => {
    const rawFindings = [
      {
        title: 'ESLint: no-eval',
        severity: 'high',
        confidence: 'high',
        source: 'eslint',
        ruleId: 'no-eval',
        filePath: 'src/app.js',
        startLine: 10,
        endLine: 10,
        evidence: 'eval(code)',
        explanation: 'eval can be harmful',
      },
      {
        title: 'Code Execution via eval()',
        severity: 'critical',
        confidence: 'high',
        source: 'semgrep',
        ruleId: 'eval-injection',
        filePath: 'src/app.js',
        startLine: 10,
        endLine: 10,
        evidence: 'eval(code)',
        explanation: 'Dynamic code execution allows arbitrary code execution',
      },
    ];

    const deduplicated = deduplicateFindings(rawFindings);
    assert.equal(deduplicated.length, 1);
    assert.equal(deduplicated[0].severity, 'critical');
    assert.equal(deduplicated[0].ruleId, 'eval-injection');
  });

  test('keeps distinct findings on the same line', () => {
    const rawFindings = [
      {
        title: 'ESLint: no-unused-vars',
        severity: 'low',
        confidence: 'high',
        source: 'eslint',
        ruleId: 'no-unused-vars',
        filePath: 'src/app.js',
        startLine: 5,
        endLine: 5,
        evidence: 'const unused = 1;',
        explanation: 'Variable unused is never used.',
      },
      {
        title: 'Potential Hardcoded Secret',
        severity: 'high',
        confidence: 'medium',
        source: 'semgrep',
        ruleId: 'hardcoded-secret',
        filePath: 'src/app.js',
        startLine: 5,
        endLine: 5,
        evidence: 'const apiKey = "1234567890123456";',
        explanation: 'Secrets should not be hardcoded.',
      },
    ];

    const deduplicated = deduplicateFindings(rawFindings);
    assert.equal(deduplicated.length, 2);
    // Verifies critical/high comes first
    assert.equal(deduplicated[0].severity, 'high');
    assert.equal(deduplicated[1].severity, 'low');
  });
});


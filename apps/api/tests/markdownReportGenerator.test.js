import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateMarkdownReport } from '../src/services/reports/markdownReportGenerator.js';

describe('Markdown Report Generator Service', () => {
  test('generates formatted report with summary table and findings', () => {
    const report = generateMarkdownReport({
      repository: { fullName: 'acme/test-app' },
      commitSha: '1234567890abcdef',
      targetRef: 'main',
      summary: { total: 1, critical: 1, high: 0, medium: 0, low: 0, info: 0 },
      findings: [
        {
          title: 'Dangerous eval() call',
          severity: 'critical',
          confidence: 'high',
          source: 'semgrep',
          ruleId: 'eval-injection',
          filePath: 'src/calc.js',
          startLine: 12,
          endLine: 12,
          evidence: 'eval(userInput);',
          explanation: 'Arbitrary code execution risk',
          suggestedFix: 'Use JSON.parse() instead',
          verificationStatus: 'verified',
        },
      ],
      project: { ecosystem: 'node', languages: ['javascript'], frameworks: ['express'] },
    });

    assert.ok(report.includes('# DevGuard AI Code Review Report'));
    assert.ok(report.includes('acme/test-app'));
    assert.ok(report.includes('1234567890abcdef'));
    assert.ok(report.includes('Dangerous eval() call'));
    assert.ok(report.includes('🔴 CRITICAL'));
    assert.ok(report.includes('src/calc.js'));
    assert.ok(report.includes('Use JSON.parse() instead'));
  });

  test('reports clean repository state when findings are empty', () => {
    const report = generateMarkdownReport({
      repository: { fullName: 'acme/clean-app' },
      commitSha: 'abcdef123456',
      targetRef: 'main',
      summary: { total: 0 },
      findings: [],
    });

    assert.ok(report.includes('No issues detected'));
  });
});

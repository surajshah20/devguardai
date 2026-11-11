import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { FindingSchema } from '../src/validators/findingSchema.js';

describe('Finding Schema Validation', () => {
  test('validates compliant finding structure from guide', () => {
    const validFinding = {
      title: 'Missing input validation',
      severity: 'high',
      confidence: 'medium',
      source: 'ai',
      ruleId: 'input-validation',
      filePath: 'src/routes/users.js',
      startLine: 24,
      endLine: 31,
      evidence: 'The request body is used without validating expected fields.',
      explanation: 'Unexpected input may reach the database operation.',
      suggestedFix: 'Validate request body with Zod schema.',
      verificationStatus: 'unverified',
    };

    const parsed = FindingSchema.safeParse(validFinding);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.title, 'Missing input validation');
  });

  test('rejects findings with invalid severity or confidence', () => {
    const invalidFinding = {
      title: 'Bad input',
      severity: 'super-critical', // invalid
      confidence: 'guess', // invalid
      source: 'ai',
      ruleId: 'rule-1',
      filePath: 'app.js',
      startLine: 1,
      endLine: 2,
      evidence: 'evidence',
      explanation: 'explanation',
    };

    const parsed = FindingSchema.safeParse(invalidFinding);
    assert.equal(parsed.success, false);
    assert.ok(parsed.error.issues.some((i) => i.path.includes('severity')));
    assert.ok(parsed.error.issues.some((i) => i.path.includes('confidence')));
  });
});


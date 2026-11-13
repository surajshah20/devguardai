import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generatePatchForFinding, generateUnifiedPatch } from '../src/services/analyzer/patchGenerator.js';

describe('Patch Generator Service', () => {
  test('generates valid unified diff patch for an individual finding', () => {
    const finding = {
      filePath: 'src/routes/users.js',
      startLine: 14,
      evidence: 'eval(userInput);',
      suggestedFix: 'JSON.parse(userInput);',
      ruleId: 'eval-injection',
    };

    const patch = generatePatchForFinding(finding);
    assert.ok(patch.includes('diff --git a/src/routes/users.js b/src/routes/users.js'));
    assert.ok(patch.includes('- eval(userInput);'));
    assert.ok(patch.includes('+ JSON.parse(userInput);'));
    assert.ok(patch.includes('@@ -14,1 +14,2 @@'));
  });

  test('creates consolidated unified patch file for multiple findings', () => {
    const findings = [
      {
        filePath: 'src/a.js',
        startLine: 5,
        evidence: 'exec(cmd)',
        suggestedFix: 'spawn(cmd)',
        ruleId: 'command-injection',
      },
      {
        filePath: 'src/b.js',
        startLine: 10,
        evidence: 'query = "SELECT * FROM t WHERE id=" + id',
        suggestedFix: 'query = "SELECT * FROM t WHERE id=$1"',
        ruleId: 'sql-injection',
      },
    ];

    const unified = generateUnifiedPatch(findings, '1234567');
    assert.ok(unified.includes('# DevGuard AI Automated Fix Patch'));
    assert.ok(unified.includes('# Target Commit: 1234567'));
    assert.ok(unified.includes('a/src/a.js'));
    assert.ok(unified.includes('a/src/b.js'));
  });
});


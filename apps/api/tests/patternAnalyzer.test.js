import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePatterns } from '../src/services/analyzer/patternAnalyzer.js';

describe('Pattern Analyzer Service', () => {
  test('flags potential command injection in child_process.exec', () => {
    const files = [
      {
        path: 'src/runner.js',
        content: [
          'import { exec } from "child_process";',
          'function runUserCommand(input) {',
          '  exec(`ping ${input}`);',
          '}',
        ].join('\n'),
      },
    ];

    const findings = analyzePatterns(files);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].ruleId, 'command-injection');
    assert.equal(findings[0].startLine, 3);
    assert.equal(findings[0].severity, 'critical');
    assert.ok(findings[0].evidence.includes('ping ${input}'));
  });

  test('flags potential SQL injection via string concatenation', () => {
    const files = [
      {
        path: 'src/db.js',
        content: [
          'function getUser(userId) {',
          '  const query = "SELECT * FROM users WHERE id = " + userId;',
          '  return db.execute(query);',
          '}',
        ].join('\n'),
      },
    ];

    const findings = analyzePatterns(files);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].ruleId, 'sql-injection');
    assert.equal(findings[0].startLine, 2);
    assert.equal(findings[0].severity, 'high');
  });

  test('flags dynamic code execution with eval', () => {
    const files = [
      {
        path: 'src/calc.js',
        content: 'const res = eval("2 + " + userInput);',
      },
    ];

    const findings = analyzePatterns(files);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].ruleId, 'eval-injection');
  });

  test('flags weak crypto hash usage (md5)', () => {
    const files = [
      {
        path: 'src/auth.js',
        content: 'const hash = crypto.createHash("md5").update(pass).digest("hex");',
      },
    ];

    const findings = analyzePatterns(files);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].ruleId, 'weak-crypto-hash');
    assert.equal(findings[0].severity, 'medium');
  });

  test('returns 0 findings for clean, secure code', () => {
    const files = [
      {
        path: 'src/math.js',
        content: [
          'export function add(a, b) {',
          '  return a + b;',
          '}',
        ].join('\n'),
      },
    ];

    const findings = analyzePatterns(files);
    assert.equal(findings.length, 0);
  });
});

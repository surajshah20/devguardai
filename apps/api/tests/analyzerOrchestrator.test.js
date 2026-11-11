import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { runStaticAnalysis } from '../src/services/analyzer/analyzerOrchestrator.js';

describe('Analyzer Orchestrator Service', () => {
  test('executes end-to-end static analysis and returns structured summary', async () => {
    const files = [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: 'vulnerable-demo',
          dependencies: { express: '^4.18.2' },
        }),
      },
      {
        path: 'src/server.js',
        content: [
          'const express = require("express");',
          'const app = express();',
          'app.get("/query", (req, res) => {',
          '  const q = "SELECT * FROM items WHERE name = " + req.query.name;',
          '  eval(req.query.cmd);',
          '  res.send(q);',
          '});',
        ].join('\n'),
      },
    ];

    const result = await runStaticAnalysis(files);

    assert.equal(result.project.ecosystem, 'node');
    assert.ok(result.project.frameworks.includes('express'));
    assert.ok(result.summary.total >= 2);
    assert.ok(result.summary.critical >= 1, 'Should have at least 1 critical finding');
    assert.ok(result.summary.high >= 1, 'Should have at least 1 high finding');
    assert.ok(result.findings.some((f) => f.ruleId === 'eval-injection' || f.ruleId === 'no-eval'));
    assert.ok(result.findings.some((f) => f.ruleId === 'sql-injection'));
  });

  test('aborts when timeout is reached', async () => {
    const files = [{ path: 'test.js', content: 'const a = 1;' }];
    await assert.rejects(
      async () => {
        await runStaticAnalysis(files, { timeoutMs: 0 });
      },
      /timed out/
    );
  });
});

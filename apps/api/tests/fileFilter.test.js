import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { shouldAnalyzeFile } from '../src/services/github/fileFilter.js';

describe('File Filter Service', () => {
  test('accepts standard JavaScript and TypeScript files', () => {
    assert.equal(shouldAnalyzeFile('src/index.js').shouldAnalyze, true);
    assert.equal(shouldAnalyzeFile('src/components/App.tsx').shouldAnalyze, true);
    assert.equal(shouldAnalyzeFile('backend/api.py').shouldAnalyze, true);
  });

  test('excludes ignored directories like node_modules, dist, and .git', () => {
    assert.equal(shouldAnalyzeFile('node_modules/express/index.js').shouldAnalyze, false);
    assert.equal(shouldAnalyzeFile('dist/bundle.js').shouldAnalyze, false);
    assert.equal(shouldAnalyzeFile('.git/config').shouldAnalyze, false);
    assert.equal(shouldAnalyzeFile('coverage/lcov.info').shouldAnalyze, false);
  });

  test('excludes package lockfiles', () => {
    assert.equal(shouldAnalyzeFile('package-lock.json').shouldAnalyze, false);
    assert.equal(shouldAnalyzeFile('yarn.lock').shouldAnalyze, false);
    assert.equal(shouldAnalyzeFile('pnpm-lock.yaml').shouldAnalyze, false);
  });

  test('excludes binary assets and images', () => {
    assert.equal(shouldAnalyzeFile('assets/logo.png').shouldAnalyze, false);
    assert.equal(shouldAnalyzeFile('docs/manual.pdf').shouldAnalyze, false);
    assert.equal(shouldAnalyzeFile('bin/runner.exe').shouldAnalyze, false);
  });

  test('excludes files exceeding maxFileSizeBytes limit', () => {
    const limits = { maxFiles: 50, maxFileSizeBytes: 1024, maxTotalSizeBytes: 10000 };
    assert.equal(shouldAnalyzeFile('src/big.js', 2048, limits).shouldAnalyze, false);
    assert.equal(shouldAnalyzeFile('src/small.js', 512, limits).shouldAnalyze, true);
  });
});

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { detectProjectType } from '../src/services/analyzer/projectDetector.js';

describe('Project Detector Service', () => {
  test('detects Node.js project with React, TypeScript, and pnpm', () => {
    const files = [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: 'my-app',
          packageManager: 'pnpm@9.0.0',
          dependencies: { react: '^18.0.0', express: '^4.18.0' },
          devDependencies: { typescript: '^5.0.0', vitest: '^1.0.0' },
        }),
      },
      { path: 'src/App.tsx', content: 'export const App = () => <div>Hello</div>;' },
      { path: 'src/App.test.tsx', content: 'test("renders", () => {});' },
    ];

    const result = detectProjectType(files);
    assert.equal(result.ecosystem, 'node');
    assert.equal(result.packageManager, 'pnpm');
    assert.equal(result.hasTypeScript, true);
    assert.equal(result.hasTests, true);
    assert.ok(result.frameworks.includes('react'));
    assert.ok(result.frameworks.includes('express'));
  });

  test('detects Python project with requirements.txt', () => {
    const files = [
      { path: 'requirements.txt', content: 'flask==2.0.1\nrequests==2.28.0' },
      { path: 'app.py', content: 'print("hello")' },
    ];

    const result = detectProjectType(files);
    assert.equal(result.ecosystem, 'python');
    assert.equal(result.packageManager, 'pip');
    assert.ok(result.languages.includes('python'));
  });

  test('detects Go project with go.mod', () => {
    const files = [
      { path: 'go.mod', content: 'module github.com/user/repo\ngo 1.22' },
      { path: 'main.go', content: 'package main' },
    ];

    const result = detectProjectType(files);
    assert.equal(result.ecosystem, 'go');
    assert.equal(result.packageManager, 'go');
  });
});

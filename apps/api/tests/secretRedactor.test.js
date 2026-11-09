import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { redactSecrets } from '../src/services/github/secretRedactor.js';

describe('Secret Redactor Service', () => {
  test('redacts GitHub Personal Access Tokens', () => {
    const raw = 'const token = "ghp_123456789012345678901234567890123456";';
    const redacted = redactSecrets(raw);
    assert.ok(!redacted.includes('ghp_'));
    assert.ok(redacted.includes('[REDACTED_GITHUB_TOKEN]'));
  });

  test('redacts AWS access keys', () => {
    const raw = 'const awsKey = "AKIAIOSFODNN7EXAMPLE";';
    const redacted = redactSecrets(raw);
    assert.ok(!redacted.includes('AKIAIOSFODNN7EXAMPLE'));
    assert.ok(redacted.includes('[REDACTED_AWS_KEY]'));
  });

  test('redacts Google API keys', () => {
    const raw = 'const key = "AIzaSyD-1234567890123456789012345678901";';
    const redacted = redactSecrets(raw);
    assert.ok(!redacted.includes('AIzaSyD-1234567890123456789012345678901'));
    assert.ok(redacted.includes('[REDACTED_GOOGLE_API_KEY]'));
  });

  test('redacts database passwords in connection strings', () => {
    const raw = 'postgres://admin:SuperSecretPass123@db.example.com:5432/mydb';
    const redacted = redactSecrets(raw);
    assert.ok(!redacted.includes('SuperSecretPass123'));
    assert.ok(redacted.includes('[REDACTED_PASSWORD]'));
  });

  test('leaves benign code untouched', () => {
    const raw = 'function add(a, b) { return a + b; }';
    assert.equal(redactSecrets(raw), raw);
  });
});

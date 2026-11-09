import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GitHubClient } from '../src/services/github/githubClient.js';

describe('GitHub Client Service', () => {
  test('initializes without token for unauthenticated public requests', () => {
    const client = new GitHubClient();
    assert.ok(client.octokit);
  });

  test('normalizes 404 error cleanly without exposing internals', () => {
    const client = new GitHubClient();
    const fakeError = new Error('Not Found');
    fakeError.status = 404;

    const normalized = client._normalizeError(fakeError, 'Fetching repo');
    assert.equal(normalized.status, 404);
    assert.ok(normalized.message.includes('Repository, ref, or file not found'));
  });

  test('normalizes 403 rate limit error with reset time info', () => {
    const client = new GitHubClient();
    const fakeError = new Error('API rate limit exceeded');
    fakeError.status = 403;
    fakeError.response = {
      headers: {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '1800000000',
      },
    };

    const normalized = client._normalizeError(fakeError, 'Checking rate limit');
    assert.equal(normalized.status, 403);
    assert.ok(normalized.message.includes('rate limit exceeded'));
  });

  test('fetchRepositoryFiles orchestrates tree traversal, filtering, and secret redaction', async () => {
    const client = new GitHubClient();

    // Stub Octokit methods on this instance for deterministic testing
    client.octokit.rest.repos.get = async () => ({
      data: {
        id: 12345,
        name: 'sample-app',
        full_name: 'test-org/sample-app',
        description: 'Test application',
        private: false,
        default_branch: 'main',
        language: 'JavaScript',
        html_url: 'https://github.com/test-org/sample-app',
      },
    });

    client.octokit.rest.repos.getCommit = async () => ({
      data: {
        sha: 'abc123commitsha',
        commit: {
          message: 'Initial commit',
          author: { name: 'Alice', date: '2026-01-01T00:00:00Z' },
        },
      },
    });

    client.octokit.rest.git.getTree = async () => ({
      data: {
        sha: 'tree123',
        truncated: false,
        tree: [
          { path: 'src/index.js', type: 'blob', size: 120, sha: 'sha1' },
          { path: 'node_modules/express/index.js', type: 'blob', size: 500, sha: 'sha2' },
          { path: 'package-lock.json', type: 'blob', size: 1000, sha: 'sha3' },
          { path: 'assets/logo.png', type: 'blob', size: 2000, sha: 'sha4' },
        ],
      },
    });

    client.octokit.rest.repos.getContent = async ({ path }) => {
      if (path === 'src/index.js') {
        const raw = 'const secretToken = "ghp_123456789012345678901234567890123456";\nconsole.log(secretToken);';
        return {
          data: {
            type: 'file',
            encoding: 'base64',
            content: Buffer.from(raw).toString('base64'),
          },
        };
      }
      throw new Error('Not found');
    };

    const result = await client.fetchRepositoryFiles({
      owner: 'test-org',
      repo: 'sample-app',
    });

    assert.equal(result.repository.fullName, 'test-org/sample-app');
    assert.equal(result.commitSha, 'abc123commitsha');
    assert.equal(result.analyzedFilesCount, 1);
    assert.equal(result.files[0].path, 'src/index.js');
    
    // Check that secret redaction was applied!
    assert.ok(!result.files[0].content.includes('ghp_'));
    assert.ok(result.files[0].content.includes('[REDACTED_GITHUB_TOKEN]'));

    // Check that excluded files were tracked in skipped
    assert.equal(result.skippedFilesCount, 3);
    const skippedPaths = result.skipped.map((s) => s.path);
    assert.ok(skippedPaths.includes('node_modules/express/index.js'));
    assert.ok(skippedPaths.includes('package-lock.json'));
    assert.ok(skippedPaths.includes('assets/logo.png'));
  });
});

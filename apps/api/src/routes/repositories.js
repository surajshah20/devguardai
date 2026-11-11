import { Router } from 'express';
import { GitHubClient } from '../services/github/githubClient.js';
import { env } from '../config/env.js';

export const repositoryRouter = Router();

// Helper to instantiate client (using header token or configured default token)
function getClient(req) {
  const authHeader = req.headers.authorization;
  let token = env.GITHUB_TOKEN;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  return new GitHubClient({ token });
}

/**
 * GET /api/repositories/:owner/:repo
 * Fetches repository overview and latest commit metadata.
 */
repositoryRouter.get('/repositories/:owner/:repo', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const { branch } = req.query;
    const client = getClient(req);

    const [meta, commit] = await Promise.all([
      client.getRepositoryMetadata(owner, repo),
      client.getLatestCommitSha(owner, repo, branch),
    ]);

    res.json({
      repository: meta,
      latestCommit: commit,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/repositories/:owner/:repo/inspect
 * Reads permitted tree and files for a repository.
 */
repositoryRouter.post('/repositories/:owner/:repo/inspect', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const { branch, maxFiles, maxFileSizeBytes } = req.body || {};
    const client = getClient(req);

    const limits = {
      ...(maxFiles ? { maxFiles: Number(maxFiles) } : {}),
      ...(maxFileSizeBytes ? { maxFileSizeBytes: Number(maxFileSizeBytes) } : {}),
    };

    const result = await client.fetchRepositoryFiles({
      owner,
      repo,
      branch,
      limits: Object.keys(limits).length > 0 ? limits : undefined,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});


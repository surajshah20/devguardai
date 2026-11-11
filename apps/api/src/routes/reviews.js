import { Router } from 'express';
import { GitHubClient } from '../services/github/githubClient.js';
import { runStaticAnalysis } from '../services/analyzer/analyzerOrchestrator.js';
import { env } from '../config/env.js';

export const reviewRouter = Router();

function getClient(req) {
  const authHeader = req.headers.authorization;
  let token = env.GITHUB_TOKEN;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  return new GitHubClient({ token });
}

/**
 * POST /api/reviews
 * Triggers a deterministic code review on a GitHub repository.
 * Body: { owner: string, repo: string, branch?: string }
 */
reviewRouter.post('/reviews', async (req, res, next) => {
  try {
    const { owner, repo, branch } = req.body || {};

    if (!owner || !repo) {
      return res.status(400).json({
        error: {
          message: 'Both "owner" and "repo" are required in request body.',
          status: 400,
        },
      });
    }

    const client = getClient(req);

    // 1. Fetch repository files safely
    const repoSnapshot = await client.fetchRepositoryFiles({
      owner,
      repo,
      branch,
    });

    // 2. Run deterministic static analysis
    const analysisReport = await runStaticAnalysis(repoSnapshot.files);

    res.json({
      repository: repoSnapshot.repository,
      targetRef: repoSnapshot.targetRef,
      commitSha: repoSnapshot.commitSha,
      commitMessage: repoSnapshot.commitMessage,
      analyzedFilesCount: repoSnapshot.analyzedFilesCount,
      project: analysisReport.project,
      summary: analysisReport.summary,
      findings: analysisReport.findings,
      durationMs: analysisReport.durationMs,
    });
  } catch (err) {
    next(err);
  }
});

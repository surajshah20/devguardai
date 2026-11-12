import { Router } from 'express';
import { GitHubClient } from '../services/github/githubClient.js';
import { DEFAULT_LIMITS } from '../services/github/fileFilter.js';
import { runStaticAnalysis } from '../services/analyzer/analyzerOrchestrator.js';
import { runAIReview } from '../services/ai/aiReviewer.js';
import { deduplicateFindings } from '../services/analyzer/findingDeduplicator.js';
import { generatePatchForFinding, generateUnifiedPatch } from '../services/analyzer/patchGenerator.js';
import { generateMarkdownReport } from '../services/reports/markdownReportGenerator.js';
import { generateJsonReport } from '../services/reports/jsonReportGenerator.js';
import { saveReportToFile } from '../services/reports/reportWriter.js';
import { reviewStore } from '../services/storage/reviewStore.js';
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
 * Initiates an end-to-end review (Static Analysis + AI Context Review).
 */
reviewRouter.post('/reviews', async (req, res, next) => {
  try {
    const { owner, repo, branch, enableAI = true, excludeTests = false } = req.body || {};

    if (!owner || !repo) {
      return res.status(400).json({
        error: {
          message: 'Both "owner" and "repo" are required in request body.',
          status: 400,
        },
      });
    }

    const client = getClient(req);
    const startTime = Date.now();

    // 1. Fetch vetted repository snapshot
    const repoSnapshot = await client.fetchRepositoryFiles({
      owner,
      repo,
      branch,
      limits: {
        ...DEFAULT_LIMITS,
        excludeTests: Boolean(excludeTests),
      },
    });

    // 2. Run deterministic static analysis
    const staticResult = await runStaticAnalysis(repoSnapshot.files);

    // 3. Run AI review if enabled
    let aiFindings = [];
    let aiError;

    if (enableAI) {
      const aiResult = await runAIReview({
        files: repoSnapshot.files,
        findings: staticResult.findings,
        project: staticResult.project,
      });
      aiFindings = aiResult.aiFindings || [];
      aiError = aiResult.error;
    }

    // 4. Merge findings & deduplicate
    const allFindings = deduplicateFindings([...staticResult.findings, ...aiFindings]);

    // Attach patch snippets to findings
    for (const f of allFindings) {
      f.patch = generatePatchForFinding(f);
    }

    // 5. Compute summary metrics
    const summary = {
      total: allFindings.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    for (const f of allFindings) {
      if (summary[f.severity] !== undefined) summary[f.severity]++;
    }

    // 6. Generate Reports
    const markdownReport = generateMarkdownReport({
      repository: repoSnapshot.repository,
      commitSha: repoSnapshot.commitSha,
      targetRef: repoSnapshot.targetRef,
      project: staticResult.project,
      summary,
      findings: allFindings,
      aiError,
    });

    // Save report files locally
    let reportPath;
    try {
      reportPath = await saveReportToFile({
        owner,
        repo,
        commitSha: repoSnapshot.commitSha,
        content: markdownReport,
        extension: 'md',
      });
    } catch (saveErr) {
      console.warn('[Review Router] Could not write report file to disk:', saveErr.message);
    }

    const totalDuration = Date.now() - startTime;

    // 7. Save to review store
    const stored = await reviewStore.saveReview({
      repository: repoSnapshot.repository,
      targetRef: repoSnapshot.targetRef,
      commitSha: repoSnapshot.commitSha,
      commitMessage: repoSnapshot.commitMessage,
      project: staticResult.project,
      summary,
      findings: allFindings,
      markdownReport,
      reportPath,
      durationMs: totalDuration,
      aiError,
      excludeTests,
    });

    res.status(201).json(stored);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reviews
 * Lists recent review runs.
 */
reviewRouter.get('/reviews', async (req, res, next) => {
  try {
    const list = await reviewStore.listReviews(20);
    res.json({ reviews: list });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reviews/:reviewId
 * Fetches review metadata and findings by ID.
 */
reviewRouter.get('/reviews/:reviewId', async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const review = await reviewStore.getReviewById(reviewId);

    if (!review) {
      return res.status(404).json({
        error: { message: `Review not found: ${reviewId}`, status: 404 },
      });
    }

    res.json(review);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reviews/:reviewId/findings
 * Returns only the findings array for a review.
 */
reviewRouter.get('/reviews/:reviewId/findings', async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const review = await reviewStore.getReviewById(reviewId);

    if (!review) {
      return res.status(404).json({
        error: { message: `Review not found: ${reviewId}`, status: 404 },
      });
    }

    res.json({
      reviewId: review.id,
      commitSha: review.commitSha,
      summary: review.summary,
      findings: review.findings,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reviews/:reviewId/report
 * Downloads or views the report as Markdown or JSON.
 */
reviewRouter.get('/reviews/:reviewId/report', async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { format = 'markdown' } = req.query;
    const review = await reviewStore.getReviewById(reviewId);

    if (!review) {
      return res.status(404).json({
        error: { message: `Review not found: ${reviewId}`, status: 404 },
      });
    }

    if (format === 'json') {
      const jsonReport = generateJsonReport({
        reviewId: review.id,
        repository: review.repository,
        commitSha: review.commitSha,
        targetRef: review.targetRef,
        summary: review.summary,
        findings: review.findings,
        project: review.project,
        durationMs: review.durationMs,
      });
      return res.json(jsonReport);
    }

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="devguard-report-${review.id}.md"`);
    res.send(review.markdownReport);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reviews/:reviewId/patch
 * Generates and downloads a unified .patch file for all actionable findings.
 */
reviewRouter.get('/reviews/:reviewId/patch', async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const review = await reviewStore.getReviewById(reviewId);

    if (!review) {
      return res.status(404).json({
        error: { message: `Review not found: ${reviewId}`, status: 404 },
      });
    }

    const patchContent = generateUnifiedPatch(review.findings, review.commitSha);
    res.setHeader('Content-Type', 'text/x-diff; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="devguard-fix-${(review.commitSha || 'head').slice(0, 7)}.patch"`);
    res.send(patchContent);
  } catch (err) {
    next(err);
  }
});

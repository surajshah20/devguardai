/**
 * Generates a structured JSON review report.
 */
export function generateJsonReport({
  reviewId,
  repository = {},
  commitSha = 'unknown',
  targetRef = 'main',
  summary = {},
  findings = [],
  project = {},
  durationMs = 0,
}) {
  return {
    version: '1.0.0',
    reviewId,
    timestamp: new Date().toISOString(),
    repository: {
      owner: repository.owner,
      name: repository.name || repository.repo,
      fullName: repository.fullName,
      defaultBranch: repository.defaultBranch,
    },
    targetRef,
    commitSha,
    project,
    summary,
    findings,
    durationMs,
  };
}


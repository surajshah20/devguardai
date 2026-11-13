/**
 * Generates unified git diff patches from code review findings.
 * Follows Phase 6 safe patching guidelines.
 */

/**
 * Creates a standard unified diff patch for a single finding.
 *
 * @param {object} finding
 * @returns {string} Unified diff patch string
 */
export function generatePatchForFinding(finding) {
  if (!finding.filePath || !finding.evidence) return '';

  const filePath = finding.filePath.replace(/\\/g, '/');
  const startLine = finding.startLine || 1;
  const originalLine = finding.evidence;
  const suggestedFix = finding.suggestedFix || '// TODO: Fix this issue';

  const diffLines = [
    `diff --git a/${filePath} b/${filePath}`,
    `--- a/${filePath}`,
    `+++ b/${filePath}`,
    `@@ -${startLine},1 +${startLine},2 @@`,
    `- ${originalLine}`,
    `+ // DevGuard Fix [${finding.ruleId}]:`,
    `+ ${suggestedFix}`,
    '',
  ];

  return diffLines.join('\n');
}

/**
 * Creates a consolidated multi-file .patch file for all actionable findings.
 *
 * @param {Array<object>} findings
 * @param {string} [commitSha]
 * @returns {string} Complete patch file content
 */
export function generateUnifiedPatch(findings = [], commitSha = 'HEAD') {
  const actionable = findings.filter((f) => f.evidence && f.filePath);
  if (actionable.length === 0) return '# No actionable patches generated.\n';

  const header = [
    `# DevGuard AI Automated Fix Patch`,
    `# Target Commit: ${commitSha}`,
    `# Total Patches: ${actionable.length}`,
    `# Apply with: git apply <patch-file>`,
    '',
  ];

  const patches = actionable.map((f) => generatePatchForFinding(f));
  return header.join('\n') + patches.join('\n');
}


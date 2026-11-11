const SEVERITY_WEIGHT = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

const EQUIVALENT_RULES = [
  ['eval-injection', 'no-eval', 'no-implied-eval'],
];

function areRulesEquivalent(ruleA, ruleB) {
  if (ruleA === ruleB) return true;
  for (const group of EQUIVALENT_RULES) {
    if (group.includes(ruleA) && group.includes(ruleB)) {
      return true;
    }
  }
  return false;
}

/**
 * Deduplicates overlapping and redundant findings from multiple static tools.
 *
 * @param {Array<object>} findings - List of findings
 * @returns {Array<object>} Deduplicated and prioritized list of findings
 */
export function deduplicateFindings(findings = []) {
  if (!findings || findings.length === 0) return [];

  const unique = [];

  for (const finding of findings) {
    const existingIndex = unique.findIndex((item) => {
      // Must be same file
      if (item.filePath !== finding.filePath) return false;

      // Check line overlap (same start line or overlapping range)
      const linesOverlap =
        item.startLine === finding.startLine ||
        (item.startLine <= finding.endLine && item.endLine >= finding.startLine);

      if (!linesOverlap) return false;

      // If rules are exact or equivalent, consider it a duplicate
      return areRulesEquivalent(item.ruleId, finding.ruleId);
    });

    if (existingIndex === -1) {
      unique.push(finding);
    } else {
      // Compare severity: keep higher severity, or richer explanation
      const existing = unique[existingIndex];
      const existingScore = SEVERITY_WEIGHT[existing.severity] || 0;
      const currentScore = SEVERITY_WEIGHT[finding.severity] || 0;

      if (currentScore > existingScore) {
        unique[existingIndex] = finding;
      } else if (currentScore === existingScore) {
        // If same score, keep finding with longer/more detailed explanation
        if ((finding.explanation || '').length > (existing.explanation || '').length) {
          unique[existingIndex] = finding;
        }
      }
    }
  }

  // Sort by severity (critical first) then by filePath and line
  return unique.sort((a, b) => {
    const scoreDiff = (SEVERITY_WEIGHT[b.severity] || 0) - (SEVERITY_WEIGHT[a.severity] || 0);
    if (scoreDiff !== 0) return scoreDiff;

    if (a.filePath !== b.filePath) {
      return a.filePath.localeCompare(b.filePath);
    }
    return a.startLine - b.startLine;
  });
}

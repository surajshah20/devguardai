#!/usr/bin/env node

import { GitHubClient } from '../src/services/github/githubClient.js';
import { runStaticAnalysis } from '../src/services/analyzer/analyzerOrchestrator.js';
import { runAIReview } from '../src/services/ai/aiReviewer.js';
import { deduplicateFindings } from '../src/services/analyzer/findingDeduplicator.js';
import { generateMarkdownReport } from '../src/services/reports/markdownReportGenerator.js';
import { saveReportToFile } from '../src/services/reports/reportWriter.js';
import { env } from '../src/config/env.js';

const target = process.argv[2];

if (!target || !target.includes('/')) {
  console.error('Usage: npm run analyze <owner>/<repo> [branch]');
  console.error('Example: npm run analyze expressjs/express');
  process.exit(1);
}

const [owner, repo] = target.split('/');
const branch = process.argv[3];

const SEVERITY_COLORS = {
  critical: '\x1b[31;1m', // Bold Red
  high: '\x1b[31m',       // Red
  medium: '\x1b[33m',     // Yellow
  low: '\x1b[36m',        // Cyan
  info: '\x1b[90m',       // Gray
  reset: '\x1b[0m',
};

async function main() {
  console.log(`\n🛡️  [DevGuard AI] Reviewing repository: ${owner}/${repo}...`);
  if (branch) console.log(`🌿 Branch: ${branch}`);

  const client = new GitHubClient({ token: env.GITHUB_TOKEN });
  const start = Date.now();

  try {
    // 1. Fetch files
    console.log('📥 Fetching repository tree and permitted text files...');
    const snapshot = await client.fetchRepositoryFiles({ owner, repo, branch });
    console.log(`✅ Loaded ${snapshot.analyzedFilesCount} source files (Commit: ${snapshot.commitSha.slice(0, 7)})`);

    // 2. Deterministic analysis
    console.log('⚙️  Running static analysis & security pattern detectors...');
    const staticResult = await runStaticAnalysis(snapshot.files);
    console.log(`🔍 Static analysis produced ${staticResult.findings.length} findings.`);

    // 3. AI review
    console.log(`🧠 Invoking AI review (${env.AI_PROVIDER.toUpperCase()} adapter)...`);
    const aiResult = await runAIReview({
      files: snapshot.files,
      findings: staticResult.findings,
      project: staticResult.project,
    });
    if (aiResult.error) {
      console.log(`⚠️  AI Notice: ${aiResult.error}`);
    } else {
      console.log(`🤖 AI Review generated ${aiResult.aiFindings.length} suggested findings.`);
    }

    // 4. Merge & Deduplicate
    const finalFindings = deduplicateFindings([...staticResult.findings, ...(aiResult.aiFindings || [])]);

    const summary = {
      total: finalFindings.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    for (const f of finalFindings) {
      if (summary[f.severity] !== undefined) summary[f.severity]++;
    }

    // 5. Generate and save Markdown Report
    const markdownReport = generateMarkdownReport({
      repository: snapshot.repository,
      commitSha: snapshot.commitSha,
      targetRef: snapshot.targetRef,
      project: staticResult.project,
      summary,
      findings: finalFindings,
      aiError: aiResult.error,
    });

    const reportPath = await saveReportToFile({
      owner,
      repo,
      commitSha: snapshot.commitSha,
      content: markdownReport,
      extension: 'md',
    });

    console.log('\n======================================================');
    console.log(`Repository:     ${snapshot.repository.fullName}`);
    console.log(`Commit SHA:     ${snapshot.commitSha}`);
    console.log(`Total Findings: ${summary.total}`);
    console.log(`Breakdown:      ${SEVERITY_COLORS.critical}Critical: ${summary.critical}${SEVERITY_COLORS.reset} | ${SEVERITY_COLORS.high}High: ${summary.high}${SEVERITY_COLORS.reset} | ${SEVERITY_COLORS.medium}Medium: ${summary.medium}${SEVERITY_COLORS.reset} | ${SEVERITY_COLORS.low}Low: ${summary.low}${SEVERITY_COLORS.reset}`);
    console.log('======================================================\n');

    for (const [index, f] of finalFindings.entries()) {
      const color = SEVERITY_COLORS[f.severity] || '';
      console.log(`${index + 1}. [${color}${f.severity.toUpperCase()}${SEVERITY_COLORS.reset}] ${f.title}`);
      console.log(`   Source:      ${f.source} (${f.ruleId}) | Status: ${f.verificationStatus}`);
      console.log(`   Location:    ${f.filePath}:${f.startLine}`);
      console.log(`   Evidence:    "${f.evidence}"`);
      console.log(`   Explanation: ${f.explanation}`);
      if (f.suggestedFix) {
        console.log(`   Fix:         ${f.suggestedFix}`);
      }
      console.log('');
    }

    console.log('======================================================');
    console.log(`📄 Markdown report saved to: ${reportPath}`);
    console.log(`✨ Total review duration: ${Date.now() - start}ms.\n`);
  } catch (err) {
    console.error(`\n❌ Error during review: ${err.message}`);
    process.exit(1);
  }
}

main();

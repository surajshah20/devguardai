#!/usr/bin/env node

import { GitHubClient } from '../src/services/github/githubClient.js';
import { runStaticAnalysis } from '../src/services/analyzer/analyzerOrchestrator.js';
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
  console.log(`\n🛡️  [DevGuard AI] Starting deterministic static analysis on ${owner}/${repo}...`);
  if (branch) console.log(`🌿 Branch: ${branch}`);

  const client = new GitHubClient({
    token: env.GITHUB_TOKEN,
  });

  try {
    const fetchStart = Date.now();
    const snapshot = await client.fetchRepositoryFiles({
      owner,
      repo,
      branch,
    });
    console.log(`📥 Downloaded & vetted ${snapshot.analyzedFilesCount} source files in ${Date.now() - fetchStart}ms`);

    const analysis = await runStaticAnalysis(snapshot.files);

    console.log('\n======================================================');
    console.log(`Repository:    ${snapshot.repository.fullName}`);
    console.log(`Commit SHA:    ${snapshot.commitSha}`);
    console.log(`Ecosystem:     ${analysis.project.ecosystem.toUpperCase()} (${analysis.project.languages.join(', ') || 'unknown'})`);
    console.log(`Total Findings: ${analysis.summary.total}`);
    console.log(`Breakdown:     ${SEVERITY_COLORS.critical}Critical: ${analysis.summary.critical}${SEVERITY_COLORS.reset} | ${SEVERITY_COLORS.high}High: ${analysis.summary.high}${SEVERITY_COLORS.reset} | ${SEVERITY_COLORS.medium}Medium: ${analysis.summary.medium}${SEVERITY_COLORS.reset} | ${SEVERITY_COLORS.low}Low: ${analysis.summary.low}${SEVERITY_COLORS.reset}`);
    console.log('======================================================\n');

    if (analysis.findings.length === 0) {
      console.log('✨ No static analysis issues or security anti-patterns detected!\n');
      return;
    }

    console.log('📋 Detected Findings:');
    for (const [index, f] of analysis.findings.entries()) {
      const color = SEVERITY_COLORS[f.severity] || '';
      console.log(`\n${index + 1}. [${color}${f.severity.toUpperCase()}${SEVERITY_COLORS.reset}] ${f.title}`);
      console.log(`   Source:      ${f.source} (${f.ruleId})`);
      console.log(`   Location:    ${f.filePath}:${f.startLine}`);
      console.log(`   Evidence:    "${f.evidence}"`);
      console.log(`   Explanation: ${f.explanation}`);
      if (f.suggestedFix) {
        console.log(`   Suggested Fix: ${f.suggestedFix}`);
      }
    }

    console.log('\n======================================================');
    console.log(`✨ Analysis completed in ${analysis.durationMs}ms.\n`);
  } catch (err) {
    console.error(`\n❌ Error during analysis: ${err.message}`);
    process.exit(1);
  }
}

main();

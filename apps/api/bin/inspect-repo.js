#!/usr/bin/env node

import { GitHubClient } from '../src/services/github/githubClient.js';
import { env } from '../src/config/env.js';

const target = process.argv[2];

if (!target || !target.includes('/')) {
  console.error('Usage: node inspect-repo.js <owner>/<repo> [branch]');
  console.error('Example: node inspect-repo.js octocat/Hello-World');
  process.exit(1);
}

const [owner, repo] = target.split('/');
const branch = process.argv[3];

async function main() {
  console.log(`\n🔍 [DevGuard AI] Inspecting repository: ${owner}/${repo}...`);
  if (branch) console.log(`🌿 Branch: ${branch}`);

  const client = new GitHubClient({
    token: env.GITHUB_TOKEN,
  });

  try {
    const summary = await client.fetchRepositoryFiles({
      owner,
      repo,
      branch,
    });

    console.log('\n=========================================');
    console.log(`Repository:    ${summary.repository.fullName}`);
    console.log(`Default Branch: ${summary.repository.defaultBranch}`);
    console.log(`Target Ref:    ${summary.targetRef}`);
    console.log(`Commit SHA:    ${summary.commitSha}`);
    console.log(`Commit Msg:    ${summary.commitMessage}`);
    console.log(`Total Entries: ${summary.totalTreeEntries}`);
    console.log(`Tree Truncated: ${summary.treeTruncated}`);
    console.log('=========================================\n');

    console.log(`✅ Permitted & Downloaded Files (${summary.analyzedFilesCount}):`);
    for (const f of summary.files) {
      console.log(`  - ${f.path} (${(f.size / 1024).toFixed(2)} KB)`);
    }

    if (summary.skipped.length > 0) {
      console.log(`\n⏭️  Skipped Files (${summary.skippedFilesCount}):`);
      for (const s of summary.skipped.slice(0, 10)) {
        console.log(`  - ${s.path} [${s.reason}]`);
      }
      if (summary.skipped.length > 10) {
        console.log(`  ... and ${summary.skipped.length - 10} more`);
      }
    }

    console.log('\n✨ Inspection complete. Ready for static analysis & AI review!\n');
  } catch (err) {
    console.error(`\n❌ Error during inspection: ${err.message}`);
    process.exit(1);
  }
}

main();

import { Octokit } from '@octokit/rest';
import { shouldAnalyzeFile, DEFAULT_LIMITS } from './fileFilter.js';
import { redactSecrets } from './secretRedactor.js';

export class GitHubClient {
  /**
   * @param {object} [options]
   * @param {string} [options.token] - GitHub access token (OAuth or PAT). If omitted, calls are unauthenticated with lower rate limits.
   * @param {string} [options.baseUrl] - Custom GitHub API base URL (for enterprise if applicable)
   */
  constructor({ token, baseUrl } = {}) {
    this.octokit = new Octokit({
      auth: token || undefined,
      baseUrl: baseUrl || undefined,
      userAgent: 'DevGuard-AI-Review-Agent/0.1.0',
    });
  }

  /**
   * Fetches repository metadata.
   * @param {string} owner
   * @param {string} repo
   */
  async getRepositoryMetadata(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.get({ owner, repo });
      return {
        id: data.id,
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        isPrivate: data.private,
        defaultBranch: data.default_branch,
        language: data.language,
        htmlUrl: data.html_url,
      };
    } catch (err) {
      throw this._normalizeError(err, `Failed to fetch repository metadata for ${owner}/${repo}`);
    }
  }

  /**
   * Gets the latest commit SHA for a branch or ref.
   * @param {string} owner
   * @param {string} repo
   * @param {string} [branch]
   */
  async getLatestCommitSha(owner, repo, branch) {
    try {
      let targetRef = branch;
      if (!targetRef) {
        const meta = await this.getRepositoryMetadata(owner, repo);
        targetRef = meta.defaultBranch;
      }

      const { data } = await this.octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: targetRef,
      });

      return {
        commitSha: data.sha,
        ref: targetRef,
        message: data.commit.message,
        author: data.commit.author?.name,
        date: data.commit.author?.date,
      };
    } catch (err) {
      throw this._normalizeError(err, `Failed to resolve commit for ${owner}/${repo} on branch "${branch}"`);
    }
  }

  /**
   * Fetches the complete git tree for a commit.
   * @param {string} owner
   * @param {string} repo
   * @param {string} treeSha
   */
  async getTree(owner, repo, treeSha) {
    try {
      const { data } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: treeSha,
        recursive: '1',
      });

      return {
        sha: data.sha,
        truncated: Boolean(data.truncated),
        entries: data.tree,
      };
    } catch (err) {
      throw this._normalizeError(err, `Failed to fetch git tree for commit ${treeSha}`);
    }
  }

  /**
   * Fetches and decodes a single text file's content.
   * @param {string} owner
   * @param {string} repo
   * @param {string} path
   * @param {string} ref
   */
  async getFileContent(owner, repo, path, ref) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if (Array.isArray(data) || data.type !== 'file') {
        throw new Error(`Target is a directory or submodule, not a single file: ${path}`);
      }

      if (data.encoding === 'base64' && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf8');
      }

      throw new Error(`Unsupported content encoding: ${data.encoding}`);
    } catch (err) {
      throw this._normalizeError(err, `Failed to fetch file content for ${path}`);
    }
  }

  /**
   * Fetches and bounds repository files for code analysis.
   * Enforces limits, excludes binaries/locks, and redacts secrets.
   * @param {object} params
   * @param {string} params.owner
   * @param {string} params.repo
   * @param {string} [params.branch]
   * @param {typeof DEFAULT_LIMITS} [params.limits]
   */
  async fetchRepositoryFiles({ owner, repo, branch, limits = DEFAULT_LIMITS }) {
    const meta = await this.getRepositoryMetadata(owner, repo);
    const targetBranch = branch || meta.defaultBranch;
    const commit = await this.getLatestCommitSha(owner, repo, targetBranch);
    const tree = await this.getTree(owner, repo, commit.commitSha);

    const candidates = [];
    const skipped = [];

    for (const item of tree.entries) {
      if (item.type !== 'blob') continue;

      const check = shouldAnalyzeFile(item.path, item.size, limits);
      if (check.shouldAnalyze) {
        candidates.push(item);
      } else {
        skipped.push({ path: item.path, reason: check.reason });
      }
    }

    // Limit the number of files analyzed
    const selected = candidates.slice(0, limits.maxFiles);
    if (candidates.length > limits.maxFiles) {
      for (const overflow of candidates.slice(limits.maxFiles)) {
        skipped.push({ path: overflow.path, reason: `Exceeded maxFiles limit of ${limits.maxFiles}` });
      }
    }

    // Fetch file contents in controlled concurrency batches
    let totalSizeBytes = 0;
    const files = [];

    for (const item of selected) {
      if (totalSizeBytes + (item.size || 0) > limits.maxTotalSizeBytes) {
        skipped.push({
          path: item.path,
          reason: `Exceeded maxTotalSizeBytes limit of ${limits.maxTotalSizeBytes}`,
        });
        continue;
      }

      try {
        const rawContent = await this.getFileContent(owner, repo, item.path, commit.commitSha);
        const safeContent = redactSecrets(rawContent);

        files.push({
          path: item.path,
          size: item.size || safeContent.length,
          sha: item.sha,
          content: safeContent,
        });

        totalSizeBytes += item.size || safeContent.length;
      } catch (err) {
        skipped.push({
          path: item.path,
          reason: `Failed to download: ${err.message}`,
        });
      }
    }

    return {
      repository: {
        owner,
        repo,
        fullName: meta.fullName,
        defaultBranch: meta.defaultBranch,
        isPrivate: meta.isPrivate,
      },
      targetRef: targetBranch,
      commitSha: commit.commitSha,
      commitMessage: commit.message,
      treeTruncated: tree.truncated,
      totalTreeEntries: tree.entries.length,
      analyzedFilesCount: files.length,
      skippedFilesCount: skipped.length,
      files,
      skipped,
    };
  }

  /**
   * Translates Octokit HTTP errors into clean domain errors with safe error messages.
   * @private
   */
  _normalizeError(err, context) {
    const status = err.status || 500;
    let message = err.message || 'Unknown GitHub API error';

    if (status === 404) {
      message = 'Repository, ref, or file not found. Ensure repository exists and token has access.';
    } else if (status === 401) {
      message = 'GitHub authentication failed. Check GITHUB_TOKEN or OAuth authorization.';
    } else if (status === 403) {
      if (err.response?.headers?.['x-ratelimit-remaining'] === '0') {
        const resetTime = err.response.headers['x-ratelimit-reset'];
        const resetDate = resetTime ? new Date(resetTime * 1000).toLocaleTimeString() : 'soon';
        message = `GitHub API rate limit exceeded. Resets at ${resetDate}. Consider configuring GITHUB_TOKEN.`;
      } else {
        message = 'Forbidden. Insufficient permissions for repository or organization.';
      }
    }

    const domainError = new Error(`${context}: ${message}`);
    domainError.status = status;
    return domainError;
  }
}

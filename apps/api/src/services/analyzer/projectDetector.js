import path from 'node:path';

/**
 * Inspects a list of repository files to detect project ecosystem,
 * languages, frameworks, and package managers.
 *
 * @param {Array<{ path: string, content?: string }>} files
 * @returns {object} Project detection summary
 */
export function detectProjectType(files = []) {
  const filePaths = files.map((f) => f.path.replace(/\\/g, '/').toLowerCase());
  const fileMap = new Map(files.map((f) => [f.path.replace(/\\/g, '/').toLowerCase(), f.content || '']));

  const languages = new Set();
  const frameworks = new Set();
  let ecosystem = 'generic';
  let packageManager = 'unknown';
  let hasTypeScript = false;
  let hasTests = false;

  // Language count for primary language determination
  const langCounts = {
    javascript: 0,
    typescript: 0,
    python: 0,
    go: 0,
    rust: 0,
    java: 0,
    ruby: 0,
    php: 0,
    csharp: 0,
  };

  for (const fp of filePaths) {
    const ext = path.extname(fp);

    if (['.js', '.mjs', '.cjs', '.jsx'].includes(ext)) {
      langCounts.javascript++;
    } else if (['.ts', '.mts', '.cts', '.tsx'].includes(ext)) {
      langCounts.typescript++;
      hasTypeScript = true;
    } else if (ext === '.py') {
      langCounts.python++;
    } else if (ext === '.go') {
      langCounts.go++;
    } else if (ext === '.rs') {
      langCounts.rust++;
    } else if (['.java', '.kt'].includes(ext)) {
      langCounts.java++;
    } else if (ext === '.rb') {
      langCounts.ruby++;
    } else if (ext === '.php') {
      langCounts.php++;
    } else if (ext === '.cs') {
      langCounts.csharp++;
    }

    if (fp.includes('test') || fp.includes('spec') || fp.includes('__tests__')) {
      hasTests = true;
    }
  }

  for (const [lang, count] of Object.entries(langCounts)) {
    if (count > 0) languages.add(lang);
  }

  // 1. Detect Node.js ecosystem & frameworks from package.json
  const packageJsonContent = fileMap.get('package.json');
  if (packageJsonContent) {
    ecosystem = 'node';
    packageManager = 'npm';

    try {
      const pkg = JSON.parse(packageJsonContent);
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };

      if (allDeps.typescript) hasTypeScript = true;
      if (allDeps.react) frameworks.add('react');
      if (allDeps.vue) frameworks.add('vue');
      if (allDeps.next) frameworks.add('nextjs');
      if (allDeps.express) frameworks.add('express');
      if (allDeps.fastify) frameworks.add('fastify');
      if (allDeps.nest || allDeps['@nestjs/core']) frameworks.add('nestjs');
      if (allDeps.jest || allDeps.vitest || allDeps.mocha) hasTests = true;

      if (pkg.packageManager) {
        if (pkg.packageManager.startsWith('pnpm')) packageManager = 'pnpm';
        else if (pkg.packageManager.startsWith('yarn')) packageManager = 'yarn';
        else if (pkg.packageManager.startsWith('npm')) packageManager = 'npm';
      }
    } catch {
      // Malformed package.json, continue with defaults
    }
  }

  // Detect lockfiles if packageManager is still default
  if (filePaths.includes('pnpm-lock.yaml')) packageManager = 'pnpm';
  else if (filePaths.includes('yarn.lock')) packageManager = 'yarn';
  else if (filePaths.includes('package-lock.json')) packageManager = 'npm';

  // 2. Detect Python ecosystem
  if (filePaths.some((f) => ['requirements.txt', 'pyproject.toml', 'pipfile', 'setup.py'].includes(path.basename(f)))) {
    if (ecosystem === 'generic') ecosystem = 'python';
    if (filePaths.includes('poetry.lock') || filePaths.includes('pyproject.toml')) {
      if (packageManager === 'unknown') packageManager = 'poetry';
    } else if (packageManager === 'unknown') {
      packageManager = 'pip';
    }
    languages.add('python');
  }

  // 3. Detect Go ecosystem
  if (filePaths.includes('go.mod')) {
    if (ecosystem === 'generic') ecosystem = 'go';
    packageManager = 'go';
    languages.add('go');
  }

  // 4. Detect Rust ecosystem
  if (filePaths.includes('cargo.toml')) {
    if (ecosystem === 'generic') ecosystem = 'rust';
    packageManager = 'cargo';
    languages.add('rust');
  }

  return {
    ecosystem,
    languages: Array.from(languages),
    frameworks: Array.from(frameworks),
    packageManager,
    hasTypeScript,
    hasTests,
    fileCount: files.length,
  };
}


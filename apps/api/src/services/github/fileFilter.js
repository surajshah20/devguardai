import path from 'node:path';

export const DEFAULT_LIMITS = {
  maxFiles: 50,
  maxFileSizeBytes: 100 * 1024, // 100 KB
  maxTotalSizeBytes: 2 * 1024 * 1024, // 2 MB total codebase per review batch
};

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.github',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.nuxt',
  'vendor',
  '.vscode',
  '.idea',
  'bin',
  'obj',
  'target',
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'composer.lock',
  'Cargo.lock',
  'Gemfile.lock',
]);

const IGNORED_EXTENSIONS = new Set([
  // Binaries & compiled artifacts
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.pdf', '.zip', '.tar', '.gz', '.tgz', '.rar', '.7z',
  '.exe', '.dll', '.so', '.dylib', '.class', '.jar', '.wasm',
  // Source maps & bundles
  '.map',
  // Fonts & audio/video
  '.ttf', '.woff', '.woff2', '.eot', '.mp3', '.mp4', '.mov',
]);

const SUPPORTED_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.jsx',
  '.ts', '.mts', '.cts', '.tsx',
  '.py',
  '.go',
  '.java',
  '.rb',
  '.php',
  '.rs',
  '.c', '.cpp', '.h', '.hpp',
  '.cs',
  '.json',
  '.yaml', '.yml',
  '.sql',
  '.sh',
  '.dockerfile',
  '.md',
]);

/**
 * Determines whether a given file path in a repository is candidate for analysis.
 * @param {string} filePath - Relative file path in the repository
 * @param {number} [size] - Size in bytes (optional)
 * @param {typeof DEFAULT_LIMITS} [limits]
 * @returns {{ shouldAnalyze: boolean, reason?: string }}
 */
export function shouldAnalyzeFile(filePath, size = 0, limits = DEFAULT_LIMITS) {
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  const filename = parts[parts.length - 1];

  // 1. Check directory exclusions
  for (const part of parts.slice(0, -1)) {
    if (IGNORED_DIRECTORIES.has(part.toLowerCase())) {
      return { shouldAnalyze: false, reason: `Excluded directory: ${part}` };
    }
  }

  // 2. Check exact filename exclusions (e.g. lockfiles)
  if (IGNORED_FILES.has(filename)) {
    return { shouldAnalyze: false, reason: `Excluded lockfile: ${filename}` };
  }

  // 3. Check minified bundles
  if (filename.endsWith('.min.js') || filename.endsWith('.min.css')) {
    return { shouldAnalyze: false, reason: 'Excluded minified asset' };
  }

  // 4. Check extension exclusions
  const ext = path.extname(filename).toLowerCase();
  if (IGNORED_EXTENSIONS.has(ext)) {
    return { shouldAnalyze: false, reason: `Binary or unsupported extension: ${ext}` };
  }

  // 5. Must have a supported extension or known file (e.g., Dockerfile)
  if (!SUPPORTED_EXTENSIONS.has(ext) && filename.toLowerCase() !== 'dockerfile') {
    return { shouldAnalyze: false, reason: `Unsupported file type: ${ext || filename}` };
  }

  // 6. Check size limit if provided
  if (size > limits.maxFileSizeBytes) {
    return { shouldAnalyze: false, reason: `File size (${size} bytes) exceeds limit (${limits.maxFileSizeBytes} bytes)` };
  }

  return { shouldAnalyze: true };
}


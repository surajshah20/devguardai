import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORTS_DIR = path.resolve(__dirname, '../../../../../reports');

/**
 * Saves a review report to the local reports/ folder.
 *
 * @param {object} params
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {string} params.commitSha
 * @param {string} params.content
 * @param {'md' | 'json'} [params.extension='md']
 * @returns {Promise<string>} File path of the saved report
 */
export async function saveReportToFile({ owner, repo, commitSha, content, extension = 'md' }) {
  const shortSha = (commitSha || 'unknown').slice(0, 7);
  const cleanOwner = (owner || 'repo').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanRepo = (repo || 'app').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `review-${cleanOwner}-${cleanRepo}-${shortSha}-${Date.now()}.${extension}`;
  const filePath = path.join(REPORTS_DIR, filename);

  await fs.mkdir(REPORTS_DIR, { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');

  return filePath;
}

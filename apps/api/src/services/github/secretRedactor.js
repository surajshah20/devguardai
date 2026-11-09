/**
 * Redacts common sensitive tokens, secrets, and credentials from code snippets
 * before passing them to external AI providers or logging.
 */

const SECRET_PATTERNS = [
  // GitHub tokens
  { regex: /gh[pousr]_[A-Za-z0-9_]{36,255}/g, replacement: '[REDACTED_GITHUB_TOKEN]' },
  { regex: /github_pat_[A-Za-z0-9_]{22}_[A-Za-z0-9_]{59}/g, replacement: '[REDACTED_GITHUB_PAT]' },

  // AWS Access Keys
  { regex: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g, replacement: '[REDACTED_AWS_KEY]' },

  // Google API Keys
  { regex: /AIza[0-9A-Za-z_-]{35}/g, replacement: '[REDACTED_GOOGLE_API_KEY]' },

  // OpenAI / generic sk- API keys
  { regex: /\bsk-[A-Za-z0-9]{32,64}\b/g, replacement: '[REDACTED_API_KEY]' },

  // Slack tokens
  { regex: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*/g, replacement: '[REDACTED_SLACK_TOKEN]' },

  // Private Keys
  {
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    replacement: '[REDACTED_PRIVATE_KEY]',
  },

  // Connection strings with embedded passwords (postgres, mysql, mongodb, redis)
  {
    regex: /((?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis):\/\/[^:]+:)([^@\s]+)(@)/gi,
    replacement: '$1[REDACTED_PASSWORD]$3',
  },

  // Generic bearer tokens
  {
    regex: /(Bearer\s+)[A-Za-z0-9\-_=]{20,}/gi,
    replacement: '$1[REDACTED_BEARER_TOKEN]',
  },
];

/**
 * Scans a text string and replaces detected credentials and tokens with redaction masks.
 * @param {string} content - Raw source code or log text
 * @returns {string} Redacted content
 */
export function redactSecrets(content) {
  if (!content || typeof content !== 'string') return content;

  let sanitized = content;
  for (const { regex, replacement } of SECRET_PATTERNS) {
    sanitized = sanitized.replace(regex, replacement);
  }
  return sanitized;
}

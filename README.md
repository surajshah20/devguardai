# DevGuard AI

<p align="center">
  <strong>Autonomous GitHub Code Review & Security Analysis Agent</strong><br>
  Combines deterministic static analysis with LLM-powered context awareness to detect vulnerabilities, explain root causes, and propose safe, reviewable unified git patches.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-blue?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/react-18.3-61dafb?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/vite-6.2-646CFF?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/tests-44%20passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
</p>

---

## Overview

**DevGuard AI** is a portfolio-grade developer security and code review agent engineered to bridge deterministic static checks with contextual LLM evaluations. It analyzes GitHub repositories without cloning files to disk, identifies high-risk security flaws (OWASP Top 10 / CWEs), provides line-level code evidence, and generates actionable, downloadable unified `.patch` fixes.

The user interface follows an **engineering-first, minimalist design system** inspired by Linear, Raycast, and Apple developer tools—eschewing generic AI gradients in favor of high-density information architecture, dark charcoal surfaces, and developer ergonomics.

---

## Key Features

- **Deterministic Security Analysis:**
  - Rule-based detection across OWASP Top 10 & CWEs: Command Injection (`CWE-78`), SQL Injection (`CWE-89`), Dynamic Code Execution (`CWE-95`), Path Traversal (`CWE-22`), Hardcoded Secrets (`CWE-798`), Insecure CORS (`CWE-942`), Prototype Pollution (`CWE-1321`), and Weak Cryptography (`CWE-328`).
- **In-Memory ESLint Engine:**
  - Programmatic AST analysis using official ESLint Linter APIs with zero disk writes, extracting syntax errors, variable issues, and deprecated patterns.
- **AI Review Provider Abstraction:**
  - Pluggable provider adapter supporting **Google Gemini API** (structured JSON mode) and local **Ollama** (`llama3`, `codellama`, `deepseek-coder`).
- **Strict Anti-Prompt-Injection Architecture:**
  - Untrusted repository content is isolated in `<CODE_DATA>` blocks and strictly treated as passive data, preventing repository comments from altering system instructions.
- **Secret Redaction Pipeline:**
  - Automatically scrubs GitHub PATs, AWS credentials, Google API keys, Slack tokens, and database connection strings before code is passed to analyzers or LLMs.
- **Automated Fix Patch Generation (`.patch`):**
  - Generates standard unified git diffs for actionable findings ready to apply locally with `git apply`.
- **Linear-Inspired Web Dashboard (`apps/web`):**
  - Real-time review execution, proportional severity distribution bars, keyboard-accessible search, segmented severity filters, dark IDE syntax blocks, and a persistent scan history rail.
- **Dual Interface Modes:**
  - Full-featured Web UI or fast terminal CLI runner (`npm run analyze <owner>/<repo>`).

---

## Architecture

```text
React Dashboard (apps/web — Linear/Apple inspired)
        │
        ▼ (HTTP / REST API)
Express API Orchestrator (apps/api)
        │
        ├──── GitHub Octokit Client (Tree traversal, size limits, secret scrubbing)
        │
        ├──── Project Type Detector (Monorepos, package managers, frameworks)
        │
        ├──── Deterministic Analysis Engine
        │       ├──── Pattern & Security Rules (OWASP Top 10 / CWEs)
        │       └──── In-Memory ESLint Linter Engine
        │
        ├──── AI Context Reviewer (Gemini API & Ollama adapters)
        │       ├──── Anti-Prompt-Injection Prompt Builder
        │       └──── Zod Schema Validation & Deduplication
        │
        ├──── Report & Patch Generators
        │       ├──── GitHub-Flavored Markdown Report Generator
        │       ├──── Structured JSON Report Generator
        │       └──── Unified Git Diff Patch Generator (.patch)
        │
        └──── In-Memory Review Store & Disk Writer (reports/*.md)
```

---

## Project Structure

```text
devguard-ai/
├── apps/
│   ├── api/                          # Express API & Core Review Orchestrator
│   │   ├── bin/
│   │   │   ├── inspect-repo.js       # Fast repository tree inspector CLI
│   │   │   └── analyze-repo.js       # End-to-end review CLI with terminal colors
│   │   ├── src/
│   │   │   ├── config/               # Zod-validated environment config
│   │   │   ├── middleware/           # Security headers (Helmet, CORS) & error handling
│   │   │   ├── routes/               # Health, Repositories, Reviews & Patch routes
│   │   │   ├── services/
│   │   │   │   ├── github/           # Octokit client, file filter & secret redactor
│   │   │   │   ├── analyzer/         # Static rules, ESLint, deduplicator & patch generator
│   │   │   │   ├── ai/               # Gemini/Ollama adapters, prompt builder & reviewer
│   │   │   │   ├── reports/          # Markdown/JSON report generators & disk writer
│   │   │   │   └── storage/          # Review run history store
│   │   │   └── server.js             # HTTP server entry point
│   │   └── tests/                    # 44 unit & integration tests (node:test)
│   └── web/                          # React + Vite Production Dashboard
│       ├── src/
│       │   ├── components/           # Workspace bar, metrics strip, findings explorer, history
│       │   ├── App.jsx               # Main dashboard container
│       │   └── index.css             # Minimalist Linear/Apple dark design system
│       └── vite.config.js            # Vite build & API proxy setup
├── reports/                          # Generated markdown & json review reports
├── guide.md                          # Full architectural blueprint & roadmap
├── .env.example                      # Environment variables template
└── package.json                      # Root npm workspace configuration
```

---

## Quick Start

### 1. Prerequisites
- **Node.js** v20.0.0 or higher
- **npm** v10.0.0 or higher

### 2. Installation
Clone the repository and install all workspace dependencies:
```bash
git clone https://github.com/surajshah20/devguardai.git
cd devguardai
npm install
```

### 3. Environment Setup
Copy the template to `.env`:
```bash
cp .env.example .env
```

Configure optional provider keys in `.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# Optional GitHub Token (increases rate limit from 60 to 5,000 req/hr)
GITHUB_TOKEN=

# AI Provider ("gemini" or "ollama")
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-2.5-flash

# Ollama settings (if AI_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434
```
*(Note: Static deterministic analysis works 100% out-of-the-box even without an AI key).*

### 4. Build and Run the Unified Dashboard
Build the React web assets and start the unified server:
```bash
# Build the web frontend
npm run build

# Start the unified server (serves API and Dashboard on port 5000)
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

---

## Development Mode

For local development with Vite hot-reloading:

```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start Vite Dev Server (port 5173 with proxy to port 5000)
npm run web
```
Open **[http://localhost:5173](http://localhost:5173)**.

---

## CLI Usage

You can run reviews directly from your terminal:

```bash
# Inspect repository metadata and permitted files:
npm run inspect expressjs/express

# Run full deterministic analysis, AI review, and generate report:
npm run analyze expressjs/express main
```

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status, uptime, and version |
| `GET` | `/api/repositories/:owner/:repo` | Repository metadata and HEAD commit SHA |
| `POST` | `/api/repositories/:owner/:repo/inspect` | Read and bound candidate source files |
| `POST` | `/api/reviews` | Trigger end-to-end code review (`owner`, `repo`, `branch`, `enableAI`, `excludeTests`) |
| `GET` | `/api/reviews` | List recent review runs |
| `GET` | `/api/reviews/:reviewId` | Retrieve complete review payload and findings |
| `GET` | `/api/reviews/:reviewId/findings` | Retrieve findings array for a review |
| `GET` | `/api/reviews/:reviewId/report` | Download or view report (`?format=markdown` or `?format=json`) |
| `GET` | `/api/reviews/:reviewId/patch` | Download consolidated unified git diff patch file (`.patch`) |

---

## Testing

DevGuard AI includes a suite of unit and integration tests using Node.js's native test runner (`node:test` and `node:assert/strict`):

```bash
npm test
```

**Test Coverage Summary:**
- Project & monorepo ecosystem detection
- Deterministic pattern matching (CWE-78, CWE-89, CWE-95, CWE-328, etc.)
- In-memory ESLint integration
- Secret scrubbing (GitHub PATs, AWS, Google API keys, DB connection strings)
- Finding deduplication & severity priority sorting
- Zod schema validation
- Unified git patch generation
- Health, repository, and review REST endpoints

---

## Security Principles

1. **Read-Only by Design:** DevGuard AI never merges pull requests, creates branches, or pushes commits without explicit user interaction.
2. **Data-Not-Instructions:** Code files are strictly encapsulated in prompt isolation blocks to defend against prompt-injection attacks.
3. **No Automatic Code Execution:** Downloaded files are parsed and inspected statically without executing scripts or running arbitrary build tools.
4. **Credential Isolation:** GitHub access tokens and API keys are stored on the backend only and never included in logs or client-side responses.

---

## License

This project is licensed under the [MIT License](LICENSE).

# DevGuard AI

> **AI-assisted GitHub Code Review & Bug Detection Agent**  
> Combines deterministic static analysis with LLM-powered context awareness to identify potential bugs, security risks, and code-quality issues, proposing safe, reviewable fixes.

---

## Architecture Overview

```text
React Dashboard (apps/web - Phase 5)
        │
        ▼
Express API (apps/api)
        │
        ├──── Authentication & GitHub OAuth
        ├──── Review Orchestrator
        │       ├──── GitHub Client (Repo metadata, tree, bounded text fetch)
        │       ├──── File Filter & Secret Redaction
        │       ├──── Static Analysis (ESLint, Semgrep)
        │       ├──── AI Review Provider (Gemini / Ollama adapter)
        │       └──── Finding Validator (Zod Schema)
        └──── Report Generator (Markdown, JSON)
```

## Safety Principles
- **Read-only by default:** DevGuard never pushes commits directly to user branches or auto-merges PRs.
- **Untrusted Code Handling:** Repository contents are treated strictly as data, never as prompt instructions.
- **Deterministic First:** Static analysis tools (ESLint, Semgrep) establish ground truth; AI provides explanation and remediation proposals.

## Project Structure

```text
devguard-ai/
├── apps/
│   ├── api/                 # Express API & Review Orchestrator
│   │   ├── src/
│   │   │   ├── config/      # Environment & settings validation (Zod)
│   │   │   ├── middleware/  # Error & security middleware
│   │   │   ├── routes/      # API endpoints (/api/health, /api/reviews, etc.)
│   │   │   ├── services/    # GitHub, Static Analyzer, AI adapters, Reports
│   │   │   └── server.js    # Entry point
│   │   └── tests/           # Unit & integration tests
│   └── web/                 # React dashboard (Phase 5)
├── reports/                 # Output directory for generated reports
├── guide.md                 # Detailed architectural blueprint & roadmap
├── .env.example             # Environment template
└── package.json             # Root workspace configuration
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Run the API Server
```bash
# Start API in development mode
npm run dev
```

### 4. Run Tests
```bash
npm test
```


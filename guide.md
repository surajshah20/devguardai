# DevGuard AI --- Project Guide

> **AI-powered GitHub Code Review & Bug Detection Agent**\
> A portfolio project that connects to GitHub repositories, analyzes
> source code, explains potential problems, and proposes safe fixes.

------------------------------------------------------------------------

## 1. Project goal

Build an agent that can:

1.  Connect to a GitHub repository with the user's permission.
2.  Inspect the repository structure and identify relevant source files.
3.  Run deterministic checks such as linting and static analysis.
4.  Ask an AI model to explain code, assess findings, and suggest
    improvements.
5.  Produce a clear report with file paths, line references, severity,
    evidence, and proposed fixes.
6.  Optionally review pull-request changes and prepare a proposed patch.

**Safety principle:** The first versions are read-only. The agent must
never push directly to a user's default branch, merge a pull request, or
deploy code automatically.

## 2. What we are building

Build the project in two layers:

-   **Core engine / CLI:** the part that fetches repository data,
    analyzes code, calls the AI model, and produces reports.
-   **Web dashboard:** a React interface that lets a user connect a
    repository, start a review, and inspect results.

Start with the CLI. Add the dashboard after the review pipeline works
reliably.

### Main user journey

1.  User signs in and authorizes access to a GitHub repository.
2.  User selects a repository and branch or pull request.
3.  DevGuard fetches the permitted files and metadata.
4.  The analyzer runs supported checks.
5.  The AI reviews relevant code and tool findings.
6.  DevGuard validates and stores the structured results.
7.  User views the report and can copy or download suggested patches.
8.  In a later version, the user can explicitly approve creation of a
    pull request.

## 3. Suggested technology stack

  -----------------------------------------------------------------------
  Area                    Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Backend                 Node.js + Express       API and orchestration

  Language                JavaScript initially;   Application logic
                          TypeScript later        

  Frontend                React + Vite            Review dashboard

  GitHub                  GitHub REST API         Repository and
                                                  pull-request access

  AI                      Gemini API free tier or Code explanations and
                          local Ollama            suggestions

  Static analysis         ESLint, Semgrep         Deterministic code
                                                  checks

  Database                PostgreSQL              Users, repositories,
                                                  reviews, findings

  Validation              Zod                     Validate API inputs and
                                                  AI output

  Testing                 Node test runner or     Unit and integration
                          Jest                    tests

  Deployment              Vercel + Render, or     Hosting
                          local deployment        
  -----------------------------------------------------------------------

### Keeping the project free

A useful free-first setup is possible, but free tiers have limits and
can change.

-   Use GitHub's API within its current rate limits.
-   Start with local development and a local PostgreSQL database.
-   Try a provider's free AI quota, if available in your region and for
    your account.
-   Alternatively, run Ollama locally. This avoids per-request
    hosted-model charges, but uses your computer's memory and processing
    power.
-   Use free hosting tiers only if their sleep, resource, and usage
    limits are acceptable.
-   Do not assume ChatGPT Free includes API credits. ChatGPT
    subscriptions and API billing are separate.

Keep the AI provider behind an adapter so the project can switch between
hosted models and Ollama without rewriting the review engine.

## 4. High-level architecture

``` text
React Dashboard (later)
        |
        v
Express API
        |
        +---- Authentication & authorization
        |
        +---- Review Orchestrator
                  |
                  +---- GitHub Client
                  |       +---- Repository metadata
                  |       +---- Branch / commit
                  |       +---- File contents
                  |       +---- Pull-request diff (later)
                  |
                  +---- File Filter & Secret Redaction
                  |
                  +---- Static Analysis
                  |       +---- ESLint
                  |       +---- Semgrep
                  |
                  +---- AI Review Provider
                  |       +---- Hosted model adapter
                  |       +---- Ollama adapter
                  |
                  +---- Finding Validator & Deduplicator
                  |
                  +---- Report Generator
                          |
                          +---- JSON report
                          +---- Markdown report
                          +---- Suggested patch (later)

PostgreSQL stores users, repository links, review runs, and findings.
```

The AI is not the only source of truth. Prefer reproducible tools for
linting and static checks. Treat AI output as a proposed finding that
must be validated, not as a confirmed vulnerability.

## 5. Repository structure

A practical starting structure:

``` text
devguard-ai/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   │   ├── github/
│   │   │   │   ├── analyzer/
│   │   │   │   ├── ai/
│   │   │   │   └── reports/
│   │   │   ├── validators/
│   │   │   └── server.js
│   │   └── tests/
│   └── web/                 # Add after the CLI pipeline works
├── packages/
│   └── core/                # Reusable review pipeline, if needed
├── examples/
│   └── sample-repository/
├── docs/
│   └── architecture.md
├── reports/                 # Local output; do not commit private reports
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Keep the first implementation smaller if a monorepo feels like too much.
A single Node.js application with clear folders is also fine.

## 6. Development roadmap

### Phase 0 --- Foundation

-   [ ] Create a public GitHub repository named `devguard-ai`.
-   [ ] Add a README explaining the problem and planned features.
-   [ ] Initialize Node.js and Express.
-   [ ] Add environment-variable loading and validation.
-   [ ] Add formatting, linting, and a basic test command.
-   [ ] Create `.env.example` and `.gitignore`.
-   [ ] Make a health-check endpoint.

**Done when:** the server starts, the health check works, and secrets
are not committed.

### Phase 1 --- Repository reader (first working milestone)

-   [ ] Create a GitHub OAuth App or GitHub App for the project.
-   [ ] Request the minimum permissions needed; begin with read-only
    repository contents and metadata.
-   [ ] Implement the GitHub client separately from Express routes.
-   [ ] Fetch repository metadata and the selected branch's latest
    commit.
-   [ ] Read the repository tree.
-   [ ] Fetch text files within size and count limits.
-   [ ] Skip binary files, generated output, dependency folders, and
    files excluded by configuration.
-   [ ] Add pagination, timeouts, and API error handling.
-   [ ] Display the file paths and basic repository summary.

**Done when:** a user can authorize a test repository and DevGuard can
list and read a small, permitted set of files.

### Phase 2 --- Deterministic code analysis

-   [ ] Detect project type and package manager.
-   [ ] Run ESLint for supported JavaScript/TypeScript projects.
-   [ ] Add Semgrep rules for supported languages.
-   [ ] Normalize tool output into a common finding format.
-   [ ] Include file path, line range, rule ID, severity, and evidence.
-   [ ] Deduplicate overlapping findings.
-   [ ] Add a timeout and resource limits to every analyzer process.

**Done when:** a sample repository produces repeatable findings without
requiring an AI model.

### Phase 3 --- AI review

-   [ ] Define an AI provider interface.
-   [ ] Implement one provider first (hosted API or Ollama).
-   [ ] Send only relevant, bounded source snippets and static-analysis
    findings.
-   [ ] Ask the model to return structured JSON, not free-form prose
    alone.
-   [ ] Validate every response with Zod.
-   [ ] Reject malformed output and handle model timeouts.
-   [ ] Ask for a concise explanation, evidence, severity, confidence,
    and suggested fix.
-   [ ] Mark AI-only findings as unverified until checked.

**Done when:** DevGuard can produce a structured review report and
clearly distinguish static-tool findings from AI suggestions.

### Phase 4 --- Reports and history

-   [ ] Save review runs and findings in PostgreSQL.
-   [ ] Generate a Markdown report.
-   [ ] Generate a JSON report for future integrations.
-   [ ] Show a summary by severity.
-   [ ] Link findings to exact file paths and line ranges where
    possible.
-   [ ] Track the commit SHA reviewed so reports are reproducible.

**Done when:** a user can revisit a review and identify exactly which
commit was analyzed.

### Phase 5 --- React dashboard

-   [ ] Add sign-in and protected routes.
-   [ ] Add repository selection.
-   [ ] Add a review-start screen.
-   [ ] Show review progress and errors.
-   [ ] Build finding cards with severity, evidence, and explanation.
-   [ ] Add filters for severity, file, and finding source.
-   [ ] Add copy/download report actions.
-   [ ] Make the interface responsive and accessible.

**Done when:** a user can complete the main review journey without using
the terminal.

### Phase 6 --- Pull-request review and proposed fixes

-   [ ] Fetch pull-request metadata and changed-file diffs.
-   [ ] Review only changed lines first, with limited surrounding
    context.
-   [ ] Compare findings against the base branch to identify new issues.
-   [ ] Generate a patch in a temporary working area.
-   [ ] Validate the patch applies cleanly.
-   [ ] Run relevant tests and static checks against the patched code.
-   [ ] Show the before/after diff.
-   [ ] Require explicit user approval before opening a pull request.
-   [ ] Never merge or push to the default branch automatically.

**Done when:** the user can inspect and approve a proposed fix before
DevGuard creates a branch or pull request.

## 7. Finding format

Use one consistent format for static-analysis and AI findings.

``` json
{
  "title": "Missing input validation",
  "severity": "high",
  "confidence": "medium",
  "source": "ai",
  "ruleId": "input-validation",
  "filePath": "src/routes/users.js",
  "startLine": 24,
  "endLine": 31,
  "evidence": "The request body is used without validating the expected fields.",
  "explanation": "Unexpected input may reach the database operation.",
  "suggestedFix": "Validate the request body with the project's schema validator.",
  "verificationStatus": "unverified"
}
```

Allowed severity values: `critical`, `high`, `medium`, `low`, `info`.

Allowed confidence values: `high`, `medium`, `low`.

Keep `source` explicit, for example `eslint`, `semgrep`, or `ai`. Do not
present an AI guess as a proven bug.

## 8. Security requirements

Security is a core feature of this project, not a final polish task.

### GitHub permissions and tokens

-   Use OAuth or a GitHub App; do not ask users to paste personal access
    tokens into the dashboard.
-   Request minimum permissions and prefer read-only access for the
    first release.
-   Keep access tokens on the backend only.
-   Encrypt stored tokens at rest, restrict access, and support
    disconnect/revocation.
-   Never send GitHub tokens to the AI model.
-   Never expose tokens in logs, errors, browser storage, or reports.

### Repository content is untrusted

A repository may contain prompt-injection text in comments, README
files, issue templates, or source strings.

-   Treat repository content as data, never as instructions to the
    agent.
-   Do not let repository text change system rules or request secrets.
-   Do not execute scripts from a repository during a review.
-   Do not install dependencies automatically in the first versions.
-   Do not expose environment variables or host files to analyzed code.
-   Use strict time, memory, file-count, and file-size limits.
-   Redact secrets before sending code to an external AI provider.
-   Tell users what data is sent to the selected model provider.

### Safe patching

-   Generate patches in an isolated temporary workspace.
-   Validate paths to prevent path traversal.
-   Never apply a patch outside the selected repository workspace.
-   Show the complete diff before approval.
-   Run tests and analysis after applying a patch.
-   Require explicit approval for branch creation and pull-request
    creation.

## 9. Testing strategy

Create a small sample repository containing intentional examples:

-   A missing input validation case.
-   An unsafe SQL query example.
-   A possible exposed secret using a fake placeholder only.
-   An unused variable or lint error.
-   A slow or duplicated operation.
-   A clean file that should not produce a finding.

Test that:

-   Correct issues are detected.
-   Clean code does not receive invented findings.
-   Invalid AI JSON is rejected.
-   Large repositories are bounded.
-   GitHub rate limits and permission errors are handled.
-   Secrets are not present in logs or AI prompts.
-   A proposed patch cannot modify unrelated files.

Track false positives as carefully as missed issues. A trustworthy
reviewer should be able to say "no issue found" rather than inventing
problems.

## 10. Environment variables

Example `.env.example`:

``` env
NODE_ENV=development
PORT=5000
DATABASE_URL=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback

AI_PROVIDER=ollama
AI_API_KEY=
AI_MODEL=
OLLAMA_BASE_URL=http://localhost:11434
```

Use only the variables required by the provider and authentication flow
you actually implement. Keep real `.env` files out of Git.

## 11. Initial API design

Possible endpoints:

  ----------------------------------------------------------------------------------------
  Method                  Endpoint                                 Purpose
  ----------------------- ---------------------------------------- -----------------------
  GET                     `/api/health`                            Health check

  GET                     `/api/auth/github`                       Start GitHub
                                                                   authorization

  GET                     `/api/auth/github/callback`              Handle authorization
                                                                   callback

  GET                     `/api/repositories`                      List authorized
                                                                   repositories

  GET                     `/api/repositories/:owner/:repo`         Repository summary

  POST                    `/api/reviews`                           Start a review

  GET                     `/api/reviews/:reviewId`                 Get review status and
                                                                   summary

  GET                     `/api/reviews/:reviewId/findings`        List findings

  GET                     `/api/reviews/:reviewId/report`          Download report

  POST                    `/api/reviews/:reviewId/patches`         Generate a proposed
                                                                   patch

  POST                    `/api/reviews/:reviewId/pull-requests`   Create a PR after
                                                                   explicit approval
  ----------------------------------------------------------------------------------------

Protect user-specific endpoints with authentication and verify
repository access on the server for every operation.

## 12. First milestone: what to build now

Do not start with the AI model or dashboard. First prove that the GitHub
reader works.

1.  Create the repository.
2.  Initialize a Node.js project.
3.  Set up Express and `GET /api/health`.
4.  Create a GitHub App or OAuth setup with minimal permissions.
5.  Implement a GitHub client that fetches one repository's metadata.
6.  Fetch its tree and read a few small text files.
7.  Print a safe summary in the terminal.
8.  Add tests for permission errors, missing files, and API failures.

Once this works, add ESLint and Semgrep. Add AI only after deterministic
findings are available.

------------------------------------------------------------------------

## 13. Definition of a successful V1

V1 is complete when:

-   A user can authorize a GitHub repository safely.
-   DevGuard can read a bounded set of text files.
-   Static analysis runs and returns structured findings.
-   An AI provider can explain findings and suggest improvements.
-   A Markdown report can be generated.
-   The report records the exact commit SHA.
-   No code is pushed or merged automatically.
-   Basic tests and security checks pass.
-   The README explains setup, limitations, permissions, and a demo.

## 14. Portfolio presentation

Suggested GitHub description:

> DevGuard AI is an AI-assisted GitHub code review agent that combines
> static analysis with LLM-powered explanations to identify potential
> bugs, security risks, and code-quality issues, then proposes safe,
> reviewable fixes.

Suggested CV bullet (use only after the features are implemented):

> Developed DevGuard AI, a GitHub-integrated code review agent using
> Node.js, React, PostgreSQL, static analysis tools, and LLMs to
> identify potential defects and generate explainable, reviewable
> code-fix suggestions.

Be accurate about what is complete. Do not claim automated pull-request
review, security scanning, or patch generation until those features are
implemented and tested.

------------------------------------------------------------------------

**Build philosophy:** Understand each module, write tests, keep the
first release read-only, and add autonomy only when the safety checks
are proven.

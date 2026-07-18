# Visual Compiler

Compile AI once. Execute forever.

Visual Compiler is a Build Week MVP showing that GPT-5.6 can interpret a complex browser instruction at compile time, emit a validated semantic workflow, and replay it later with deterministic Playwright automation and zero runtime model calls.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Studio: http://127.0.0.1:3000  
Demo site: http://127.0.0.1:4173/demo?variant=A

Runtime-only demo, no OpenAI key required:

```bash
npm run demo:runtime
```

## Problem

Browser agents often call a model at every click. That creates latency, cost, nondeterminism, privacy risk, and poor auditability. Traditional automation is deterministic, but it struggles with human spatial instructions like "check the first enabled checkbox to the right of Pending review."

## Solution

Visual Compiler separates intelligence from execution:

```mermaid
flowchart LR
  A[DOM + accessibility + screenshot context] --> B[GPT-5.6 compile-time interpreter]
  B --> C[Validated Semantic IR]
  C --> D[Deterministic locator compiler]
  D --> E[Saved workflow artifact]
  E --> F[Playwright runtime]
  F --> G[Zero LLM calls]
```

## Compile Time vs Runtime

| Stage   | Uses GPT-5.6                     | Requires API key     | Output                                            |
| ------- | -------------------------------- | -------------------- | ------------------------------------------------- |
| Compile | Yes, when `USE_LIVE_OPENAI=true` | Yes for live compile | Semantic IR + ranked locators + Playwright source |
| Runtime | No                               | No                   | Deterministic browser actions + telemetry         |

## Demo Instruction

```text
In the row containing 'Pending review', check the first enabled checkbox to the right of the status text, then click the green confirmation button below the table.
```

The workflow compiles against layout variant A and replays against variants A and B while preserving semantic relationships.

## Supported MVP Actions

`click`, `check`, `uncheck`, `fill`, `select`, `wait`, `assert`.

Supported relations include right of, left of, above, below, same row, same column, nearest, first matching, second matching, enabled-only, and visible-only.

## Repository Structure

```text
apps/demo-site          Controlled page with layout variants A and B
apps/studio             Local studio UI and backend API
packages/semantic-ir    Zod schemas for validated IR
packages/page-model     DOM/accessibility/geometry extraction
packages/spatial        Deterministic geometry utilities
packages/locator-engine Candidate generation and ranking
packages/compiler       GPT-5.6 compile-time interpreter and codegen
packages/runtime        Playwright runtime with no OpenAI dependency
compiled-workflows      Saved deterministic artifacts
tests                   Unit, integration, and E2E tests
docs                    Supporting architecture and submission docs
```

## Testing

```bash
npm test
npm run test:e2e
```

If Playwright reports that Chromium is missing, run:

```bash
npx playwright install chromium
```

In restricted sandboxes where npm cannot write to `/root/.npm`, use:

```bash
npm --cache /tmp/npm-cache install
```

## Security and Privacy

The runtime package has no OpenAI SDK dependency, compiled workflows do not store API keys, and runtime telemetry reports `llmCalls: 0`. This project is intended only for authorized browser automation.

## Limitations

This MVP is a controlled vertical slice. It does not target arbitrary public websites, CAPTCHA solving, authentication bypass, stealth automation, or high-risk transaction flows.

## Build Week Track

Primary: Developer Tools. Secondary: Work and Productivity, agentic workflows, browser automation infrastructure, testing and RPA tooling.

## How Codex Was Used

Codex designed and implemented the monorepo, deterministic runtime, demo page, schemas, tests, and documentation drafts from the product prompt.

## How GPT-5.6 Is Used

GPT-5.6 is used only during compilation to interpret the instruction into strict validated JSON. Runtime execution loads the compiled artifact and uses Playwright without model access.

## License

MIT.

## Authors

Project authorship placeholder.

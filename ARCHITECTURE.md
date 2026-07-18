# Architecture

Visual Compiler is a two-phase automation system.

```mermaid
flowchart TD
  Capture[Capture page model] --> Interpret[GPT-5.6 compile-time interpretation]
  Interpret --> IR[Validated Semantic IR]
  IR --> Locate[Locator candidate generation]
  Locate --> Validate[Rank and reject fragile locators]
  Validate --> Artifact[Saved workflow JSON + generated Playwright]
  Artifact --> Runtime[Playwright runtime]
  Runtime --> Telemetry[Assertions + telemetry: llmCalls=0]
```

## Compile-Time Boundary

The compiler package may import the OpenAI SDK. It converts natural language and page context into validated semantic steps. Model output is parsed through Zod before being used.

## Runtime Boundary

The runtime package imports Playwright and Zod only. It loads a compiled workflow, resolves semantic locator rules against the live page, executes actions, and verifies postconditions. It never imports OpenAI and does not require `OPENAI_API_KEY`.

## Locator Ranking

The MVP ranks role/name, label association, text/DOM relation, semantic row/column, stable attributes, DOM relation, spatial bounds, OCR, image template, and absolute coordinate strategies. Only the implemented deterministic strategies execute in the current runtime.

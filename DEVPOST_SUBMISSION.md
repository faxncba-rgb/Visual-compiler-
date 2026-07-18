# Devpost Submission Draft

## Project Name

Visual Compiler

## Tagline

Compile AI once. Execute forever.

## Category

Developer Tools

## Inspiration

Browser agents are powerful, but they pay the cost of intelligence at every step. We wanted to test whether model intelligence could be compiled once into deterministic automation that is cheaper, faster, and easier to audit.

## What It Does

Visual Compiler captures a page model, asks GPT-5.6 to interpret a complex spatial instruction, validates the result as Semantic IR, generates ranked locator strategies, and saves a deterministic Playwright workflow. The workflow later runs with no API key and reports zero runtime model calls.

## How It Was Built

The MVP is a TypeScript monorepo with a local demo site, page model extractor, Zod schemas, locator engine, compiler, Playwright runtime, studio UI, and tests.

## How GPT-5.6 Was Used

GPT-5.6 is used only at compile time to turn natural language and page context into strict validated JSON. It does not generate unchecked executable code.

## How Codex Was Used

Codex implemented the repository structure, demo page, runtime, compiler path, tests, and documentation from the product brief.

## Challenges

The hardest part was proving resilience without hiding behind runtime model repair. The demo therefore mutates IDs, classes, row order, and spacing while preserving semantic relationships.

## Accomplishments

- Runtime package has no OpenAI SDK dependency.
- Runtime works with `OPENAI_API_KEY` removed.
- Variant A and B replay use the same compiled workflow.
- The studio displays compile-time and runtime model call counts.

## What Is Next

Add browser extension recording, OCR fallback execution, broader web app support, richer ambiguity handling, and enterprise audit exports.

## Links

Repository URL: https://github.com/faxncba-rgb/Visual-compiler-  
Demo URL: placeholder  
YouTube URL: placeholder  
Codex Session ID: placeholder

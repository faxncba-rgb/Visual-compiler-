# Codex Collaboration

## Components Codex Designed

- Monorepo structure separating compile-time and runtime packages.
- Controlled demo site with layout variants A and B.
- Semantic IR schemas and runtime telemetry schemas.
- Deterministic locator engine and spatial utilities.
- Playwright runtime with no OpenAI SDK dependency.
- Local studio UI and submission documentation.

## Components Codex Implemented

- Demo website.
- Page model extraction.
- GPT-5.6 compile-time interpreter interface with strict JSON validation.
- Mock interpreter for offline tests.
- Locator ranking and candidate diagnostics.
- Generated Playwright source.
- Runtime replay with assertions and zero-LLM telemetry.
- Unit, integration, and E2E tests.

## Human Decisions That Shaped The Product

- Separation of compile-time and runtime.
- Prohibition of LLM calls during execution.
- Controlled demo scope.
- Preference for explainability over broad autonomy.
- Selection of locator ranking rules.
- Decision to reject low-confidence compilation.

## Limitations Identified By Codex

- OCR and image-template fallback interfaces exist in the IR, but the MVP does not execute them.
- Arbitrary public sites are explicitly out of scope.
- Live compilation depends on a valid OpenAI API key and model access.

## Bugs Found And Fixed With Codex

- Placeholder: update with final validation notes before submission.

## Testing Generated Or Improved With Codex

- Semantic IR validation.
- Spatial relation calculations.
- Locator ranking and disabled-target exclusion.
- Runtime import safeguard.
- Runtime no-API-key path.
- Layout variant replay.

## GPT-5.6 Contribution At Compile Time

GPT-5.6 interprets the natural-language instruction and page model into validated JSON semantic steps. The runtime never calls GPT-5.6.

## Feedback

/feedback Codex Session ID: placeholder

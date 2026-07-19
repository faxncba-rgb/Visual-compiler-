# Progress

## Completed Milestones

- Milestone 0: repository setup, lint/format baseline, TypeScript config, test
  config, and basic docs.
- Milestone 1: controlled demo site with variants A and B.
- Milestone 3: Semantic IR schemas and validation tests.
- Milestone 5: spatial utilities and locator ranking tests.
- Milestone 7: deterministic runtime package with no OpenAI dependency safeguard
  tests.
- Milestone 9: end-to-end compilation and deterministic browser replay across
  layout variants A and B.
- Milestone 10: responsive mobile Studio, persistent workflow storage, health
  checks, pinned Playwright production image, and Traefik-compatible Hostinger
  VPS deployment template.

## Current State

- Branch: `codex/vps-mobile-deployment`.
- Studio uses a single-column, safe-area-aware layout at phone widths with
  44-pixel touch controls and a scrollable demo preview/details view.
- `DEMO_SITE_INTERNAL_URL` is used by server-side Playwright;
  `DEMO_SITE_PUBLIC_URL` is used by the iframe.
- Compiled workflows are written atomically to `WORKFLOW_STORAGE_DIR` and the
  production template mounts a named volume there.
- Studio and demo expose JSON health endpoints; Studio health verifies that
  workflow storage is readable and writable.
- Playwright and the production Microsoft Playwright image are pinned to
  `1.61.1`; the image includes matching Chromium and Linux dependencies.
- The runtime package still has no OpenAI dependency, blocks service workers and
  OpenAI browser requests, and only succeeds with zero model/OpenAI calls.
- The Compose template publishes no host ports, requires an existing Traefik
  access-control middleware for Studio, and passes `OPENAI_API_KEY` only to the
  server-side Studio container.
- The compiler now uses the Responses API Structured Outputs helper with a
  strict Zod schema compatible with OpenAI's required-field rules, requests
  `gpt-5.6` at medium reasoning effort, disables response storage, and records
  the response model and token usage in diagnostics.
- Local development commands load `.env` automatically. The current local file
  is ignored by Git, has mode `0600`, and contains the expected live-compile
  settings without exposing the credential to browser code or runtime.
- No VPS deployment or GitHub push has been performed.

## Bugs Found and Fixed

- Browser page-model capture failed under the TypeScript runtime because a
  generated `__name` helper was serialized into `page.evaluate`; capture now
  runs as browser-native JavaScript.
- Repeated `Pending review` labels could make compilation choose an unrelated
  anchor with no spatial candidates; anchor selection now skips duplicates that
  do not produce a valid related target.
- E2E compilation overwrote the tracked precompiled artifact; tests now write to
  an isolated test output path.
- The production-only install would have omitted `tsx`; it is now a production
  dependency and the npm lockfile records that classification.
- The original interpreter schema used optional object properties, which strict
  Structured Outputs rejects; the API-facing schema now uses required nullable
  fields and strips null object fields before application validation.

## Verification Status

- Dependency install: `npm ci` passed with npm 11.10.0 bootstrapped through the
  bundled Node environment; audit reported zero vulnerabilities.
- `npm run build`: passing.
- `npm test`: passing.
- Matching Playwright Chromium 1228 for Playwright `1.61.1`: installed.
- `npm run test:e2e`: passing, including layout variants A/B and an iPhone-sized
  Safari-user-agent Studio check.
- Strict Structured Outputs schema test: passing and verifies that all generated
  object schemas forbid additional properties and require every property.
- Local GPT-5.6 attempt: the request reached OpenAI but was rejected before
  generation with HTTP `429`, code `insufficient_quota`. No workflow artifact
  was overwritten.
- Deterministic local replay after that attempt: variants A and B both passed
  with `llmCalls: 0` and `openAIRequests: 0`.
- Compose YAML parse: passing.
- Docker image build and `docker compose config`: not run because Docker is not
  installed in this workspace environment.

## Remaining External Verification

- Enable billing or add credits to the OpenAI API project that owns the local
  key, wait for the quota change to propagate, then rerun `npm run demo:live`.
- After a successful live compile, inspect the saved diagnostics and rerun the
  complete E2E suite against the newly generated artifact.
- Docker image, Compose, physical iPhone, and VPS validation are retained only
  as unvalidated future options and are not part of the current macOS milestone.

## Next Actions Requiring User Direction

- Confirm that API billing or credits are active for the project that owns the
  key before another paid API attempt.
- Push the branch to GitHub only after the local GPT-5.6 milestone is complete
  and explicit approval is reconfirmed.

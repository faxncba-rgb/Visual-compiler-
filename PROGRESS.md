# Progress

## Completed Milestones

- Milestone 0: repository setup, lint/format baseline, TypeScript config, test config, basic docs.
- Milestone 1: controlled demo site with variants A and B.
- Milestone 3: Semantic IR schemas and validation tests.
- Milestone 5: spatial utilities and locator ranking tests.
- Milestone 7: deterministic runtime package with no OpenAI dependency safeguard tests.

## Current Milestone

- Milestone 9: end-to-end browser validation.

## Known Issues

- Live GPT-5.6 compilation requires `OPENAI_API_KEY` and `USE_LIVE_OPENAI=true`.
- OCR and image template strategies are represented in the schema but not implemented in the MVP runtime.
- Playwright browser binary download is blocked in the current sandbox; E2E can run after `npx playwright install chromium` in a normal environment.
- Local Git initialization is blocked because `.git/hooks` is read-only; the initial public repository is published through the authenticated GitHub connector instead.

## Next Actions

- Run Playwright E2E once browser binaries are available.
- Capture screenshots for README after local browser validation.

## Demo Readiness

- Runtime-only workflow artifact is present; browser validation pending in this sandbox.

## Test Status

- `npm run build`: passing.
- `npm test`: passing.
- `npm run test:e2e`: blocked by missing Playwright Chromium binary in this sandbox.
- GitHub repository: connected with write access; initial source publication completed through the connector.

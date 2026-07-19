# Codex Collaboration

## Components Codex Designed

- Monorepo structure separating compile-time and runtime packages.
- Controlled demo site with layout variants A and B.
- Semantic IR schemas and runtime telemetry schemas.
- Deterministic locator engine and spatial utilities.
- Playwright runtime with no OpenAI SDK dependency.
- Responsive Studio UI and mobile interaction model.
- Private/public demo URL boundary for VPS operation.
- Persistent artifact storage and service health model.
- Pinned production container and Traefik deployment topology.

## Components Codex Implemented

- Demo website and phone-width table interaction.
- Page model extraction.
- GPT-5.6 compile-time interpreter interface with strict JSON validation.
- Mock interpreter for offline tests.
- Locator ranking, duplicate-anchor handling, and candidate diagnostics.
- Generated Playwright source.
- Runtime replay with assertions, blocked OpenAI traffic, and zero-LLM
  telemetry.
- Atomic compiled-workflow writes and configurable persistent storage.
- Studio/demo health endpoints.
- Production Dockerfile and Compose template.
- Deployment, verification, update, backup, and rollback documentation.
- Unit, integration, deployment-configuration, mobile, and runtime E2E tests.

## Human Decisions That Shaped the Product

- Separation of compile-time and runtime.
- Prohibition of LLM calls during execution.
- Controlled demo scope.
- Preference for explainability over broad autonomy.
- Selection of locator ranking rules.
- Decision to reject low-confidence compilation.
- Requirement to prepare but not execute the Hostinger VPS deployment.
- Requirement to keep secrets out of the repository and browser client.

## Limitations Identified by Codex

- OCR and image-template fallback interfaces exist in the IR, but the MVP does
  not execute them.
- Arbitrary public sites are explicitly out of scope.
- Live compilation depends on a valid OpenAI API key and model access.
- Mobile E2E uses Chromium with an iPhone Safari viewport/user agent; physical
  Safari verification remains a deployment-stage check.
- Docker is unavailable in this workspace, so the image and resolved Compose
  model must be validated on a Docker-capable host before deployment.

## Bugs Found and Fixed with Codex

- Replaced a TypeScript-loader-transformed `page.evaluate` function that failed
  in the browser with a browser-native evaluator.
- Made locator compilation skip unrelated duplicate text anchors.
- Prevented E2E tests from mutating the tracked workflow artifact.
- Corrected the production dependency classification needed by container start
  scripts.
- Removed the desktop-only three-column/mobile-overflow behavior from Studio.
- Added client-visible request errors and disabled controls during compile/run.

## Testing Generated or Improved with Codex

- Semantic IR validation.
- Spatial relation calculations.
- Locator ranking, duplicate-anchor selection, and disabled-target exclusion.
- Runtime import/dependency/network safeguards.
- Runtime no-API-key path.
- Layout variant replay with zero OpenAI calls.
- iPhone-sized Studio layout, touch target, iframe, and storage-health checks.
- Deployment pin, internal/public URL, persistent-volume, and no-host-port
  assertions.

## GPT-5.6 Contribution at Compile Time

GPT-5.6 interprets the natural-language instruction and page model into validated
JSON semantic steps when live compilation is explicitly enabled. The runtime
never imports or calls GPT-5.6.

## Milestone Handoff

The `codex/vps-mobile-deployment` branch contains the completed deployment/mobile
milestone. It has not been pushed or deployed. `DEPLOYMENT.md` is the operational
handoff for a future explicitly authorized VPS session.

## Feedback

/feedback Codex Session ID: placeholder

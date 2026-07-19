# Hostinger VPS Deployment

This is a deployment template, not a record of a live deployment. No VPS changes
have been made.

## Topology and security boundary

The Compose template runs two containers from the same pinned production image:

- `studio` serves the UI and performs server-side compilation and deterministic
  Playwright replay.
- `demo` serves the controlled page rendered in the Studio iframe.

Traefik is the only public ingress. Neither container publishes a host port.
Playwright uses `http://demo:4173` over the private Compose network, while Safari
loads `https://$DEMO_DOMAIN` through Traefik. `OPENAI_API_KEY` is passed only to
the server-side `studio` container, never to `demo`, client JavaScript, compiled
workflows, or runtime telemetry.

The image is pinned to Playwright `1.61.1` through
`mcr.microsoft.com/playwright:v1.61.1-noble`. That image includes the matching
Chromium browser and Linux system dependencies. The runtime package itself has
no OpenAI dependency. It reports `llmCalls: 0`, blocks attempted browser traffic
to OpenAI hosts, and fails the run if any such attempt occurs.

## Prerequisites

- A Hostinger VPS with Docker Engine and Docker Compose v2.
- An existing Traefik container with a Docker network, HTTPS entrypoint, and
  certificate resolver.
- An existing Traefik authentication, SSO, or IP-allowlist middleware protecting
  Studio. Do not expose its compile/run APIs anonymously.
- Two DNS records pointing to the VPS: one for Studio and one for the demo.
- A non-root deployment account that can run Docker.

Do not commit `.env.production`. Keep it readable only by the deployment user.
An OpenAI key is optional; leave live compilation disabled to run the precompiled
or mock-compiled demo without one.

## Prepare and validate

Run these commands from a clean checkout on the VPS only when you are ready to
deploy:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Edit `.env.production` locally on the VPS. Set the two DNS names and copy the
existing Traefik network, entrypoint, and certificate-resolver names exactly.
Set `TRAEFIK_STUDIO_MIDDLEWARES` to the existing access-control middleware name,
including its provider suffix (for example, `studio-auth@docker`). Do not put
the middleware's credentials in this repository. Do not put secrets in Compose,
shell history, source control, screenshots, or support messages.

Validate the rendered configuration before starting anything:

```bash
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker network inspect "$(sed -n 's/^TRAEFIK_NETWORK=//p' .env.production)"
```

Build the pinned image and inspect the resolved Playwright versions:

```bash
docker compose --env-file .env.production -f compose.production.yml build --pull
docker compose --env-file .env.production -f compose.production.yml run --rm --no-deps studio \
  node -e "console.log(require('playwright/package.json').version)"
```

The printed version must be `1.61.1`.

## First deployment

When the validation above succeeds:

```bash
docker compose --env-file .env.production -f compose.production.yml up -d
docker compose --env-file .env.production -f compose.production.yml ps
```

Do not add firewall exceptions for ports 3000 or 4173. Traefik reaches them over
its Docker network.

## Verify

Wait until both services report healthy. Load the deployment variables without
printing their values:

```bash
set -a
. ./.env.production
set +a
```

Then verify the public endpoints:

```bash
curl --fail --show-error --silent "https://$STUDIO_DOMAIN/health"
curl --fail --show-error --silent "https://$DEMO_DOMAIN/health"
```

Verify the private Playwright target from inside Studio:

```bash
docker compose --env-file .env.production -f compose.production.yml exec -T studio \
  node -e "fetch('http://demo:4173/health').then(async r => { console.log(r.status); process.exit(r.ok ? 0 : 1) })"
```

Open Studio in Safari on an iPhone, compile the sample instruction, and run both
layout variants. The runtime log must show `llmCalls: 0`,
`openAIRequests: 0`, and every step as `passed`.

Inspect recent logs without exposing the environment:

```bash
docker compose --env-file .env.production -f compose.production.yml logs --tail=100 demo studio
```

Never use `docker inspect` output in public logs when a credential is configured,
because container environment values may be included.

## Back up persistent workflows

Compiled workflows live in the named `visual-compiler-workflows` volume (or the
name set by `WORKFLOW_VOLUME_NAME`). Back it up before every update:

```bash
mkdir -p backups
chmod 700 backups
docker compose --env-file .env.production -f compose.production.yml run --rm --no-deps \
  -v "$PWD/backups:/backup" --entrypoint sh studio \
  -c 'tar -czf "/backup/workflows-$(date -u +%Y%m%dT%H%M%SZ).tgz" -C /app/compiled-workflows .'
```

Store backups outside the repository and test restoration periodically.

## Safe update

1. Record the currently deployed git commit and `IMAGE_TAG`.
2. Back up the workflow volume.
3. Fetch the intended release and inspect its diff and release notes.
4. Set `IMAGE_TAG` to the new immutable git SHA in `.env.production`.
5. Build first; only replace containers after the build and config checks pass.

```bash
git status --short
git fetch --prune
git switch --detach <reviewed-release-sha>
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker compose --env-file .env.production -f compose.production.yml build --pull
docker compose --env-file .env.production -f compose.production.yml up -d --wait
```

Repeat every verification step. Keep the previous image until the new release
has passed browser replay.

## Rollback

Set `IMAGE_TAG` back to the previously recorded immutable tag and check out its
matching git commit, then recreate the containers without rebuilding:

```bash
git switch --detach <previous-release-sha>
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker compose --env-file .env.production -f compose.production.yml up -d --no-build --wait
```

Re-run health and workflow checks. A normal code rollback must not delete or
recreate the workflow volume. Restore a backup only if a release changed or
corrupted stored workflow data:

```bash
docker compose --env-file .env.production -f compose.production.yml stop studio
docker compose --env-file .env.production -f compose.production.yml run --rm --no-deps \
  -v "$PWD/backups:/backup:ro" --entrypoint sh studio \
  -c 'find /app/compiled-workflows -mindepth 1 -maxdepth 1 -delete && tar -xzf /backup/<backup-file>.tgz -C /app/compiled-workflows'
docker compose --env-file .env.production -f compose.production.yml up -d studio
```

Choose the backup filename explicitly. Do not use an unreviewed wildcard for a
restore.

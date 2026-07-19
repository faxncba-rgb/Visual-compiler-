FROM mcr.microsoft.com/playwright:v1.61.1-noble AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/demo-site/package.json apps/demo-site/package.json
COPY apps/studio/package.json apps/studio/package.json
COPY packages/compiler/package.json packages/compiler/package.json
COPY packages/locator-engine/package.json packages/locator-engine/package.json
COPY packages/page-model/package.json packages/page-model/package.json
COPY packages/runtime/package.json packages/runtime/package.json
COPY packages/semantic-ir/package.json packages/semantic-ir/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/spatial/package.json packages/spatial/package.json

RUN npm ci

COPY tsconfig.json vitest.config.ts playwright.config.ts ./
COPY apps apps
COPY packages packages
COPY scripts scripts
COPY tests tests
COPY compiled-workflows compiled-workflows

RUN npm run build

FROM mcr.microsoft.com/playwright:v1.61.1-noble AS runtime

LABEL org.opencontainers.image.title="Visual Compiler" \
      org.opencontainers.image.description="Compile-time semantic browser workflows with deterministic Playwright replay"

ENV NODE_ENV=production \
    HOME=/tmp \
    NPM_CONFIG_CACHE=/tmp/npm-cache \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    WORKFLOW_STORAGE_DIR=/app/compiled-workflows

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/demo-site/package.json apps/demo-site/package.json
COPY apps/studio/package.json apps/studio/package.json
COPY packages/compiler/package.json packages/compiler/package.json
COPY packages/locator-engine/package.json packages/locator-engine/package.json
COPY packages/page-model/package.json packages/page-model/package.json
COPY packages/runtime/package.json packages/runtime/package.json
COPY packages/semantic-ir/package.json packages/semantic-ir/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/spatial/package.json packages/spatial/package.json

RUN npm ci --omit=dev && npm cache clean --force

COPY tsconfig.json ./
COPY apps apps
COPY packages packages
COPY scripts scripts
COPY compiled-workflows compiled-workflows

EXPOSE 3000 4173

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.STUDIO_PORT || '3000') + '/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"]

CMD ["npm", "run", "start:studio"]

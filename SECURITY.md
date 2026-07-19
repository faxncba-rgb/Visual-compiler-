# Security And Ethics

Visual Compiler is a developer tool for authorized browser automation.

It does not include CAPTCHA bypass, credential theft, stealth automation, anti-detection methods, unauthorized access, financial transaction execution, medical decision automation, or bypass of user consent.

Compiled workflows do not store API keys. `OPENAI_API_KEY` is optional and is
passed only to the server-side Studio service. It is never embedded in the
Studio HTML, iframe URL, demo container, workflow artifact, or runtime
telemetry.

The runtime package has no OpenAI dependency. Runtime-controlled browser
requests to OpenAI hosts are aborted; any attempt fails the run. Successful
runtime telemetry is possible only with `llmCalls: 0` and
`openAIRequests: 0`.

The production template publishes no host ports. Traefik is the only ingress,
the internal Playwright target uses a private Docker network, compiled workflows
use a persistent named volume, both services have health checks, and Studio
requires an existing Traefik authentication or IP-allowlist middleware.
Deployment operators should keep `.env.production` at mode `0600`, avoid
printing rendered configuration containing secrets, and follow the
backup/update/rollback procedure in `DEPLOYMENT.md`.

The MVP runs only against a controlled demo site.

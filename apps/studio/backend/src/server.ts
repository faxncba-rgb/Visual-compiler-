import express from "express";
import { constants, existsSync } from "node:fs";
import { access, mkdir, readFile } from "node:fs/promises";
import { compileWorkflow } from "@visual-compiler/compiler";
import { runCompiledWorkflow } from "@visual-compiler/runtime";
import {
  DEFAULT_DEMO_INTERNAL_URL,
  DEFAULT_DEMO_PUBLIC_URL,
  DEFAULT_INSTRUCTION,
  WORKFLOW_PATH,
  WORKFLOW_STORAGE_DIR,
} from "@visual-compiler/shared";

const port = Number(process.env.STUDIO_PORT ?? 3000);
const host = process.env.STUDIO_HOST ?? "0.0.0.0";

function normalizedBaseUrl(value: string, variableName: string) {
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      throw new Error();
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${variableName} must be a valid HTTP(S) URL.`);
  }
}

const internalDemoUrl = normalizedBaseUrl(
  DEFAULT_DEMO_INTERNAL_URL,
  "DEMO_SITE_INTERNAL_URL",
);
const publicDemoUrl = normalizedBaseUrl(
  DEFAULT_DEMO_PUBLIC_URL,
  "DEMO_SITE_PUBLIC_URL",
);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function demoUrl(baseUrl: string, variant: "A" | "B") {
  return `${baseUrl}/demo?variant=${variant}`;
}

async function ensureWorkflowStorage() {
  await mkdir(WORKFLOW_STORAGE_DIR, { recursive: true });
  await access(WORKFLOW_STORAGE_DIR, constants.R_OK | constants.W_OK);
}

function studioHtml() {
  const initialDemoUrl = demoUrl(publicDemoUrl, "A");
  const serializedPublicDemoUrl = JSON.stringify(publicDemoUrl).replaceAll(
    "<",
    "\\u003c",
  );
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#101216">
  <title>Visual Compiler Studio</title>
  <style>
    :root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #eef2f8; background: #101216; color-scheme: dark; }
    * { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }
    body { margin: 0; min-width: 0; background: #101216; }
    .app { display: grid; grid-template-columns: minmax(290px, 340px) minmax(420px, 1fr) minmax(330px, 430px); min-height: 100vh; min-height: 100dvh; }
    aside, section { min-width: 0; border-right: 1px solid #2a3039; }
    .left, .right { padding: 18px; overflow: auto; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    h2 { margin: 0 0 12px; font-size: 14px; color: #9facbf; text-transform: uppercase; letter-spacing: .08em; }
    .tagline { color: #9facbf; margin-top: 0; }
    textarea { display: block; width: 100%; min-height: 156px; resize: vertical; border: 1px solid #3b4555; background: #171b22; color: #f5f7fb; border-radius: 7px; padding: 12px; font: inherit; font-size: 16px; line-height: 1.4; }
    button, select { min-height: 44px; border: 1px solid #3c4858; background: #1d2430; color: #f3f6fb; border-radius: 7px; padding: 10px 12px; font: inherit; font-weight: 700; touch-action: manipulation; }
    button { cursor: pointer; }
    button:focus-visible, select:focus-visible, textarea:focus-visible { outline: 3px solid #65bff3; outline-offset: 2px; }
    button.primary { background: #2f8f68; border-color: #2f8f68; }
    button.secondary { background: #263044; }
    button:disabled { cursor: wait; opacity: .62; }
    .row { display: flex; gap: 10px; align-items: center; margin-top: 12px; flex-wrap: wrap; }
    .metric { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 10px 0; border-bottom: 1px solid #29313c; }
    .metric strong { font-size: 22px; color: #fff; }
    .preview { min-height: 480px; background: #fff; }
    iframe { display: block; width: 100%; height: 100%; min-height: 480px; border: 0; background: white; }
    pre { margin: 0; background: #0b0d10; border: 1px solid #29313c; border-radius: 7px; padding: 12px; overflow: auto; max-height: calc(100dvh - 88px); font-size: 12px; line-height: 1.45; white-space: pre-wrap; overflow-wrap: anywhere; }
    .tabs { display: flex; gap: 6px; margin-bottom: 12px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .tabs button { flex: 0 0 auto; min-height: 40px; padding: 7px 9px; font-size: 12px; }
    .ok { color: #64d790; }
    .warn { color: #f0bd59; }
    .error { color: #ff8585; }
    @media (max-width: 980px) {
      .app { grid-template-columns: 1fr; min-height: auto; }
      aside, section { border-right: 0; border-bottom: 1px solid #2a3039; }
      .left, .right { overflow: visible; padding-left: max(18px, env(safe-area-inset-left)); padding-right: max(18px, env(safe-area-inset-right)); }
      .left { padding-top: max(18px, env(safe-area-inset-top)); }
      .right { padding-bottom: max(18px, env(safe-area-inset-bottom)); }
      .preview { height: 68svh; min-height: 460px; }
      iframe { min-height: 460px; }
      pre { max-height: 60svh; }
    }
    @media (max-width: 520px) {
      .left, .right { padding-top: 16px; padding-bottom: 16px; }
      .row > select { flex: 1 1 100%; width: 100%; }
      .row > button { flex: 1 1 calc(33.333% - 10px); }
      .metric { font-size: 14px; }
      .metric strong { font-size: 19px; }
      .preview { height: 72svh; min-height: 430px; }
      iframe { min-height: 430px; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; }
    }
  </style>
</head>
<body>
  <main class="app">
    <aside class="left">
      <h1>Visual Compiler</h1>
      <p class="tagline">Compile AI once. Execute forever.</p>
      <h2>Instruction</h2>
      <textarea id="instruction" aria-label="Workflow instruction">${escapeHtml(DEFAULT_INSTRUCTION)}</textarea>
      <div class="row">
        <select id="variant" aria-label="Demo layout"><option value="A">Variant A</option><option value="B">Variant B</option></select>
        <button class="primary" id="compile">Compile</button>
        <button class="secondary" id="runA">Run A</button>
        <button class="secondary" id="runB">Run B</button>
      </div>
      <div style="margin-top:18px" aria-live="polite">
        <div class="metric"><span>Compile-time model calls</span><strong id="compileCalls">0</strong></div>
        <div class="metric"><span>Compile response model</span><strong id="compileModel">-</strong></div>
        <div class="metric"><span>Compile tokens (in / out)</span><strong id="compileTokens">-</strong></div>
        <div class="metric"><span>Runtime model calls</span><strong id="runtimeCalls">0</strong></div>
        <div class="metric"><span>Selected locator confidence</span><strong id="confidence">-</strong></div>
        <div class="metric"><span>Status</span><strong id="status" class="warn">Idle</strong></div>
      </div>
    </aside>
    <section class="preview" aria-label="Demo preview">
      <iframe id="demo" title="Controlled workflow demo" src="${escapeHtml(initialDemoUrl)}"></iframe>
    </section>
    <aside class="right">
      <div class="tabs" role="tablist" aria-label="Workflow details">
        <button role="tab" data-tab="ir">Semantic IR</button>
        <button role="tab" data-tab="locators">Locators</button>
        <button role="tab" data-tab="code">Playwright</button>
        <button role="tab" data-tab="log">Runtime log</button>
      </div>
      <pre id="output" tabindex="0">No workflow loaded.</pre>
    </aside>
  </main>
  <script>
    const publicDemoUrl = ${serializedPublicDemoUrl};
    const state = { workflow: null, telemetry: null, tab: "ir" };
    const output = document.getElementById("output");
    const controls = Array.from(document.querySelectorAll("#compile, #runA, #runB"));
    const variantUrl = variant => publicDemoUrl + "/demo?variant=" + variant;
    const setBusy = busy => controls.forEach(button => { button.disabled = busy; });
    const setStatus = (text, cls = "warn") => { const el = document.getElementById("status"); el.textContent = text; el.className = cls; };
    const render = () => {
      if (!state.workflow) { output.textContent = "No workflow loaded."; return; }
      if (state.tab === "ir") output.textContent = JSON.stringify(state.workflow, null, 2);
      if (state.tab === "locators") output.textContent = JSON.stringify(state.workflow.steps.map(s => ({ id: s.id, intent: s.intent, candidates: s.candidates, selectedLocator: s.selectedLocator })), null, 2);
      if (state.tab === "code") output.textContent = state.workflow.generatedPlaywright;
      if (state.tab === "log") output.textContent = JSON.stringify(state.telemetry ?? { message: "Run workflow to collect telemetry." }, null, 2);
      document.querySelectorAll("[data-tab]").forEach(button => button.setAttribute("aria-selected", String(button.dataset.tab === state.tab)));
    };
    const requestJson = async (url, body) => {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await response.json();
      if (!response.ok) throw Object.assign(new Error(json.error ?? "Request failed."), { response: json });
      return json;
    };
    document.querySelectorAll("[data-tab]").forEach(btn => btn.addEventListener("click", () => { state.tab = btn.dataset.tab; render(); }));
    document.getElementById("variant").addEventListener("change", event => { document.getElementById("demo").src = variantUrl(event.target.value); });
    document.getElementById("compile").addEventListener("click", async () => {
      setBusy(true);
      setStatus("Compiling");
      try {
        const variant = document.getElementById("variant").value;
        const json = await requestJson("/api/compile", { instruction: document.getElementById("instruction").value, variant });
        state.workflow = json.workflow;
        document.getElementById("compileCalls").textContent = state.workflow.diagnostics.modelCalls;
        document.getElementById("compileModel").textContent = state.workflow.diagnostics.responseModel ?? state.workflow.compileModel;
        const usage = state.workflow.diagnostics.tokenUsage;
        document.getElementById("compileTokens").textContent = usage ? usage.inputTokens + " / " + usage.outputTokens : "-";
        document.getElementById("confidence").textContent = Math.round(state.workflow.steps[0].selectedLocator.confidence * 100) + "%";
        setStatus("Compiled", "ok");
        render();
      } catch (error) {
        setStatus("Failed", "error");
        output.textContent = JSON.stringify(error.response ?? { error: error.message }, null, 2);
      } finally {
        setBusy(false);
      }
    });
    async function run(variant) {
      setBusy(true);
      setStatus("Running");
      document.getElementById("demo").src = variantUrl(variant);
      try {
        const json = await requestJson("/api/run", { variant });
        state.telemetry = json.telemetry;
        document.getElementById("runtimeCalls").textContent = state.telemetry.llmCalls;
        setStatus("Passed", "ok");
      } catch (error) {
        state.telemetry = error.response ?? { error: error.message };
        setStatus("Failed", "error");
      } finally {
        state.tab = "log";
        render();
        setBusy(false);
      }
    }
    document.getElementById("runA").addEventListener("click", () => run("A"));
    document.getElementById("runB").addEventListener("click", () => run("B"));
    render();
  </script>
</body>
</html>`;
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  next();
});

app.get("/", (_req, res) => res.type("html").send(studioHtml()));
app.get("/health", async (_req, res) => {
  try {
    await ensureWorkflowStorage();
    res.json({
      ok: true,
      status: "healthy",
      service: "studio",
      storage: {
        writable: true,
        workflowPresent: existsSync(WORKFLOW_PATH),
      },
      runtimeOpenAIAllowed: false,
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      status: "unhealthy",
      service: "studio",
      storage: { writable: false },
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
app.post("/api/compile", async (req, res) => {
  try {
    const instruction =
      typeof req.body.instruction === "string"
        ? req.body.instruction.trim()
        : DEFAULT_INSTRUCTION;
    if (!instruction || instruction.length > 10_000) {
      res.status(400).json({
        error: "Instruction must contain between 1 and 10,000 characters.",
      });
      return;
    }
    await ensureWorkflowStorage();
    const variant = req.body.variant === "B" ? "B" : "A";
    const workflow = await compileWorkflow({
      instruction,
      url: demoUrl(internalDemoUrl, variant),
      outPath: WORKFLOW_PATH,
    });
    res.json({ workflow });
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : String(error) });
  }
});
app.post("/api/run", async (req, res) => {
  try {
    await ensureWorkflowStorage();
    if (!existsSync(WORKFLOW_PATH)) {
      await compileWorkflow({
        instruction: DEFAULT_INSTRUCTION,
        url: demoUrl(internalDemoUrl, "A"),
        outPath: WORKFLOW_PATH,
      });
    }
    const variant = req.body.variant === "B" ? "B" : "A";
    const telemetry = await runCompiledWorkflow({
      workflowPath: WORKFLOW_PATH,
      url: demoUrl(internalDemoUrl, variant),
      headless: true,
    });
    res.json({ telemetry });
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : String(error) });
  }
});
app.get("/api/workflow", async (_req, res) => {
  try {
    res.json(JSON.parse(await readFile(WORKFLOW_PATH, "utf8")));
  } catch {
    res.status(404).json({ error: "No compiled workflow yet." });
  }
});

app.listen(port, host, () =>
  console.log(`Studio listening on http://${host}:${port}`),
);

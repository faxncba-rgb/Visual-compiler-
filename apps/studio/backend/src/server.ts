import express from "express";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { compileWorkflow } from "@visual-compiler/compiler";
import { runCompiledWorkflow } from "@visual-compiler/runtime";
import {
  DEFAULT_DEMO_URL,
  DEFAULT_INSTRUCTION,
  WORKFLOW_PATH,
} from "@visual-compiler/shared";

const port = Number(process.env.STUDIO_PORT ?? 3000);
const app = express();
app.use(express.json({ limit: "2mb" }));

function studioHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Visual Compiler Studio</title>
  <style>
    :root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #eef2f8; background: #101216; }
    body { margin: 0; background: #101216; }
    .app { display: grid; grid-template-columns: 340px minmax(520px, 1fr) 430px; height: 100vh; }
    aside, section { border-right: 1px solid #2a3039; min-width: 0; }
    .left, .right { padding: 18px; overflow: auto; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    h2 { margin: 0 0 12px; font-size: 14px; color: #9facbf; text-transform: uppercase; letter-spacing: .08em; }
    textarea { width: 100%; min-height: 156px; resize: vertical; box-sizing: border-box; border: 1px solid #3b4555; background: #171b22; color: #f5f7fb; border-radius: 7px; padding: 12px; font: inherit; line-height: 1.4; }
    button, select { border: 1px solid #3c4858; background: #1d2430; color: #f3f6fb; border-radius: 7px; padding: 10px 12px; font-weight: 700; }
    button.primary { background: #2f8f68; border-color: #2f8f68; }
    button.secondary { background: #263044; }
    .row { display: flex; gap: 10px; align-items: center; margin-top: 12px; flex-wrap: wrap; }
    .metric { display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 10px 0; border-bottom: 1px solid #29313c; }
    .metric strong { font-size: 22px; color: #fff; }
    iframe { width: 100%; height: 100%; border: 0; background: white; }
    pre { background: #0b0d10; border: 1px solid #29313c; border-radius: 7px; padding: 12px; overflow: auto; max-height: 35vh; font-size: 12px; line-height: 1.45; }
    .tabs { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
    .tabs button { padding: 7px 9px; font-size: 12px; }
    .ok { color: #64d790; }
    .warn { color: #f0bd59; }
    .error { color: #ff8585; }
  </style>
</head>
<body>
  <div class="app">
    <aside class="left">
      <h1>Visual Compiler</h1>
      <p style="color:#9facbf;margin-top:0">Compile AI once. Execute forever.</p>
      <h2>Instruction</h2>
      <textarea id="instruction">${DEFAULT_INSTRUCTION}</textarea>
      <div class="row">
        <select id="variant"><option value="A">Variant A</option><option value="B">Variant B</option></select>
        <button class="primary" id="compile">Compile</button>
        <button class="secondary" id="runA">Run A</button>
        <button class="secondary" id="runB">Run B</button>
      </div>
      <div style="margin-top:18px">
        <div class="metric"><span>Compile-time model calls</span><strong id="compileCalls">0</strong></div>
        <div class="metric"><span>Runtime model calls</span><strong id="runtimeCalls">0</strong></div>
        <div class="metric"><span>Selected locator confidence</span><strong id="confidence">-</strong></div>
        <div class="metric"><span>Status</span><strong id="status" class="warn">Idle</strong></div>
      </div>
    </aside>
    <section><iframe id="demo" src="${DEFAULT_DEMO_URL}/demo?variant=A"></iframe></section>
    <aside class="right">
      <div class="tabs">
        <button data-tab="ir">Semantic IR</button>
        <button data-tab="locators">Locators</button>
        <button data-tab="code">Playwright</button>
        <button data-tab="log">Runtime log</button>
      </div>
      <pre id="output">No workflow loaded.</pre>
    </aside>
  </div>
  <script>
    const state = { workflow: null, telemetry: null, tab: "ir" };
    const output = document.getElementById("output");
    const setStatus = (text, cls = "warn") => { const el = document.getElementById("status"); el.textContent = text; el.className = cls; };
    const render = () => {
      if (!state.workflow) { output.textContent = "No workflow loaded."; return; }
      if (state.tab === "ir") output.textContent = JSON.stringify(state.workflow, null, 2);
      if (state.tab === "locators") output.textContent = JSON.stringify(state.workflow.steps.map(s => ({ id: s.id, intent: s.intent, candidates: s.candidates, selectedLocator: s.selectedLocator })), null, 2);
      if (state.tab === "code") output.textContent = state.workflow.generatedPlaywright;
      if (state.tab === "log") output.textContent = JSON.stringify(state.telemetry ?? { message: "Run workflow to collect telemetry." }, null, 2);
    };
    document.querySelectorAll("[data-tab]").forEach(btn => btn.addEventListener("click", () => { state.tab = btn.dataset.tab; render(); }));
    document.getElementById("variant").addEventListener("change", e => document.getElementById("demo").src = "${DEFAULT_DEMO_URL}/demo?variant=" + e.target.value);
    document.getElementById("compile").addEventListener("click", async () => {
      setStatus("Compiling");
      const variant = document.getElementById("variant").value;
      const res = await fetch("/api/compile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ instruction: document.getElementById("instruction").value, variant }) });
      const json = await res.json();
      if (!res.ok) { setStatus("Failed", "error"); output.textContent = JSON.stringify(json, null, 2); return; }
      state.workflow = json.workflow;
      document.getElementById("compileCalls").textContent = state.workflow.diagnostics.modelCalls;
      document.getElementById("confidence").textContent = Math.round(state.workflow.steps[0].selectedLocator.confidence * 100) + "%";
      setStatus("Compiled", "ok");
      render();
    });
    async function run(variant) {
      setStatus("Running");
      document.getElementById("demo").src = "${DEFAULT_DEMO_URL}/demo?variant=" + variant;
      const res = await fetch("/api/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ variant }) });
      const json = await res.json();
      state.telemetry = json.telemetry ?? json;
      document.getElementById("runtimeCalls").textContent = state.telemetry.llmCalls ?? 0;
      setStatus(res.ok ? "Passed" : "Failed", res.ok ? "ok" : "error");
      state.tab = "log";
      render();
    }
    document.getElementById("runA").addEventListener("click", () => run("A"));
    document.getElementById("runB").addEventListener("click", () => run("B"));
  </script>
</body>
</html>`;
}

app.get("/", (_req, res) => res.type("html").send(studioHtml()));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.post("/api/compile", async (req, res) => {
  try {
    const variant = req.body.variant === "B" ? "B" : "A";
    const url = `${DEFAULT_DEMO_URL}/demo?variant=${variant}`;
    const workflow = await compileWorkflow({
      instruction: req.body.instruction ?? DEFAULT_INSTRUCTION,
      url,
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
    if (!existsSync(WORKFLOW_PATH)) {
      await compileWorkflow({
        instruction: DEFAULT_INSTRUCTION,
        url: `${DEFAULT_DEMO_URL}/demo?variant=A`,
        outPath: WORKFLOW_PATH,
      });
    }
    const variant = req.body.variant === "B" ? "B" : "A";
    const telemetry = await runCompiledWorkflow({
      workflowPath: WORKFLOW_PATH,
      url: `${DEFAULT_DEMO_URL}/demo?variant=${variant}`,
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

app.listen(port, () =>
  console.log(`Studio listening on http://127.0.0.1:${port}`),
);

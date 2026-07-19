import { existsSync } from "node:fs";
import path from "node:path";
import { createDemoServer } from "../apps/demo-site/src/server.js";
import { compileWorkflow } from "@visual-compiler/compiler";
import { runCompiledWorkflow } from "@visual-compiler/runtime";
import {
  DEFAULT_DEMO_URL,
  DEFAULT_INSTRUCTION,
  WORKFLOW_PATH,
  WORKFLOW_STORAGE_DIR,
} from "@visual-compiler/shared";

const { server } = createDemoServer();
try {
  let workflowPath = WORKFLOW_PATH;
  if (!existsSync(WORKFLOW_PATH)) {
    const workflow = await compileWorkflow({
      instruction: DEFAULT_INSTRUCTION,
      url: `${DEFAULT_DEMO_URL}/demo?variant=A`,
      outDir: WORKFLOW_STORAGE_DIR,
      headless: true,
    });
    workflowPath = path.join(WORKFLOW_STORAGE_DIR, `${workflow.id}.json`);
  }
  delete process.env.OPENAI_API_KEY;
  const a = await runCompiledWorkflow({
    workflowPath,
    url: `${DEFAULT_DEMO_URL}/demo?variant=A`,
    headless: true,
  });
  const b = await runCompiledWorkflow({
    workflowPath,
    url: `${DEFAULT_DEMO_URL}/demo?variant=B`,
    headless: true,
  });
  console.log(
    JSON.stringify({ variantA: a, variantB: b, runtimeLLMCalls: 0 }, null, 2),
  );
} finally {
  server.close();
}

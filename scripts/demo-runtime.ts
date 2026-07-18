import { existsSync } from "node:fs";
import { createDemoServer } from "../apps/demo-site/src/server.js";
import { compileWorkflow } from "@visual-compiler/compiler";
import { runCompiledWorkflow } from "@visual-compiler/runtime";
import {
  DEFAULT_DEMO_URL,
  DEFAULT_INSTRUCTION,
  WORKFLOW_PATH,
} from "@visual-compiler/shared";

const { server } = createDemoServer();
try {
  if (!existsSync(WORKFLOW_PATH)) {
    await compileWorkflow({
      instruction: DEFAULT_INSTRUCTION,
      url: `${DEFAULT_DEMO_URL}/demo?variant=A`,
      outPath: WORKFLOW_PATH,
      headless: true,
    });
  }
  delete process.env.OPENAI_API_KEY;
  const a = await runCompiledWorkflow({
    workflowPath: WORKFLOW_PATH,
    url: `${DEFAULT_DEMO_URL}/demo?variant=A`,
    headless: true,
  });
  const b = await runCompiledWorkflow({
    workflowPath: WORKFLOW_PATH,
    url: `${DEFAULT_DEMO_URL}/demo?variant=B`,
    headless: true,
  });
  console.log(
    JSON.stringify({ variantA: a, variantB: b, runtimeLLMCalls: 0 }, null, 2),
  );
} finally {
  server.close();
}

import { compileWorkflow } from "@visual-compiler/compiler";
import {
  DEFAULT_DEMO_URL,
  DEFAULT_INSTRUCTION,
  WORKFLOW_STORAGE_DIR,
} from "@visual-compiler/shared";
import path from "node:path";

const workflow = await compileWorkflow({
  instruction: DEFAULT_INSTRUCTION,
  url: `${DEFAULT_DEMO_URL}/demo?variant=A`,
  outDir: WORKFLOW_STORAGE_DIR,
  headless: true,
});
const workflowPath = path.join(WORKFLOW_STORAGE_DIR, `${workflow.id}.json`);

console.log(
  JSON.stringify(
    { saved: workflowPath, modelCalls: workflow.diagnostics.modelCalls },
    null,
    2,
  ),
);

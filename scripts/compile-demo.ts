import { compileWorkflow } from "@visual-compiler/compiler";
import {
  DEFAULT_DEMO_URL,
  DEFAULT_INSTRUCTION,
  WORKFLOW_PATH,
} from "@visual-compiler/shared";

const workflow = await compileWorkflow({
  instruction: DEFAULT_INSTRUCTION,
  url: `${DEFAULT_DEMO_URL}/demo?variant=A`,
  outPath: WORKFLOW_PATH,
  headless: true,
});

console.log(
  JSON.stringify(
    { saved: WORKFLOW_PATH, modelCalls: workflow.diagnostics.modelCalls },
    null,
    2,
  ),
);

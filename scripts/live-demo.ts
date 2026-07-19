import { createDemoServer } from "../apps/demo-site/src/server.js";
import { compileWorkflow } from "@visual-compiler/compiler";
import { runCompiledWorkflow } from "@visual-compiler/runtime";
import {
  DEFAULT_DEMO_INTERNAL_URL,
  DEFAULT_INSTRUCTION,
  WORKFLOW_PATH,
} from "@visual-compiler/shared";

if (process.env.USE_LIVE_OPENAI !== "true") {
  throw new Error("Set USE_LIVE_OPENAI=true in .env before running demo:live.");
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Set OPENAI_API_KEY in .env before running demo:live.");
}

const { server } = createDemoServer();
try {
  const workflow = await compileWorkflow({
    instruction: DEFAULT_INSTRUCTION,
    url: `${DEFAULT_DEMO_INTERNAL_URL}/demo?variant=A`,
    outPath: WORKFLOW_PATH,
    headless: true,
  });

  delete process.env.OPENAI_API_KEY;
  process.env.USE_LIVE_OPENAI = "false";

  const variants = await Promise.all(
    (["A", "B"] as const).map(async (variant) => ({
      variant,
      telemetry: await runCompiledWorkflow({
        workflowPath: WORKFLOW_PATH,
        url: `${DEFAULT_DEMO_INTERNAL_URL}/demo?variant=${variant}`,
        headless: true,
      }),
    })),
  );

  console.log(
    JSON.stringify(
      {
        compile: {
          source: workflow.diagnostics.interpretationSource,
          modelCalls: workflow.diagnostics.modelCalls,
          requestedModel: workflow.compileModel,
          responseModel: workflow.diagnostics.responseModel,
          tokenUsage: workflow.diagnostics.tokenUsage,
          workflowPath: WORKFLOW_PATH,
        },
        runtime: variants.map(({ variant, telemetry }) => ({
          variant,
          llmCalls: telemetry.llmCalls,
          openAIRequests: telemetry.openAIRequests,
          stepsPassed: telemetry.steps.every(
            (step) => step.status === "passed",
          ),
          durationMs: telemetry.durationMs,
        })),
      },
      null,
      2,
    ),
  );
} catch (error) {
  const apiError = error as {
    code?: string;
    status?: number;
    type?: string;
  };

  if (
    apiError.status === 429 &&
    (apiError.code === "insufficient_quota" ||
      apiError.type === "insufficient_quota")
  ) {
    console.error(
      "Live GPT-5.6 compilation reached OpenAI but the API project has insufficient quota. Add API billing or credits to the project that owns this key, wait a few minutes, then rerun npm run demo:live.",
    );
  } else {
    console.error(
      `Live demo failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  process.exitCode = 1;
} finally {
  delete process.env.OPENAI_API_KEY;
  server.close();
}

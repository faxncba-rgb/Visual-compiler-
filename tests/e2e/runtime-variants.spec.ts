import { test, expect } from "@playwright/test";
import { compileWorkflow } from "@visual-compiler/compiler";
import { runCompiledWorkflow } from "@visual-compiler/runtime";
import { DEFAULT_INSTRUCTION, WORKFLOW_PATH } from "@visual-compiler/shared";

test("compiled workflow replays on variants A and B with zero runtime LLM calls", async ({}, testInfo) => {
  const workflowPath = testInfo.outputPath("pending-review.workflow.json");
  await compileWorkflow({
    instruction: DEFAULT_INSTRUCTION,
    url: "http://127.0.0.1:4173/demo?variant=A",
    outPath: workflowPath,
    headless: true,
  });
  delete process.env.OPENAI_API_KEY;
  for (const variant of ["A", "B"] as const) {
    const telemetry = await runCompiledWorkflow({
      workflowPath,
      url: `http://127.0.0.1:4173/demo?variant=${variant}`,
      headless: true,
    });
    expect(telemetry.llmCalls).toBe(0);
    expect(telemetry.openAIRequests).toBe(0);
    expect(telemetry.steps.every((step) => step.status === "passed")).toBe(
      true,
    );
  }
});

test("tracked GPT-5.6 artifact replays on variants A and B without OpenAI", async () => {
  delete process.env.OPENAI_API_KEY;
  for (const variant of ["A", "B"] as const) {
    const telemetry = await runCompiledWorkflow({
      workflowPath: WORKFLOW_PATH,
      url: `http://127.0.0.1:4173/demo?variant=${variant}`,
      headless: true,
      finalStateExpectations: {
        checkedAccessibleName: "Insurance document primary checkbox",
        visibleText: "Compiled workflow completed",
      },
    });
    expect(telemetry.llmCalls).toBe(0);
    expect(telemetry.openAIRequests).toBe(0);
    expect(telemetry.steps).toHaveLength(2);
    expect(telemetry.steps.every((step) => step.status === "passed")).toBe(
      true,
    );
    expect(telemetry.finalState).toEqual({
      checkedAccessibleName: "Insurance document primary checkbox",
      checked: true,
      visibleText: "Compiled workflow completed",
      textVisible: true,
    });
  }
});

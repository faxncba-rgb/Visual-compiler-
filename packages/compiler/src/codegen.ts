import type { SemanticWorkflow } from "@visual-compiler/semantic-ir";

export function generatePlaywrightSource(
  workflow: Omit<SemanticWorkflow, "generatedPlaywright">,
) {
  return `import { runCompiledWorkflow } from "@visual-compiler/runtime";

await runCompiledWorkflow({
  workflowPath: "compiled-workflows/${workflow.id}.json",
  url: process.env.DEMO_SITE_URL ?? "${workflow.metadata.targetUrl}",
  headless: false
});
`;
}

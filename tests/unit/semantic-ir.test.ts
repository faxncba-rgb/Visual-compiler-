import { describe, expect, it } from "vitest";
import { SemanticWorkflowSchema } from "@visual-compiler/semantic-ir";

describe("Semantic IR schema", () => {
  it("validates a minimal deterministic workflow", () => {
    const parsed = SemanticWorkflowSchema.parse({
      id: "w1",
      version: "0.1.0",
      name: "Example",
      source: {
        url: "http://localhost",
        viewport: { width: 1280, height: 720 },
      },
      steps: [
        {
          id: "s1",
          action: "click",
          intent: "Click confirm",
          target: { role: "button", accessibleName: "Confirm", relations: [] },
          preconditions: [],
          postconditions: [],
          candidates: [],
          selectedLocator: {
            kind: "playwright",
            primary: "role=button",
            confidence: 0.9,
            explanation: "role",
          },
        },
      ],
      generatedPlaywright: "await page.click('button')",
      compiledAt: new Date().toISOString(),
      compileModel: "gpt-5.6",
      metadata: { compilerVersion: "0.1.0", targetUrl: "http://localhost" },
      diagnostics: {
        modelCalls: 1,
        interpretationSource: "gpt-5.6",
        warnings: [],
        durationMs: 1,
        rejected: false,
      },
    });
    expect(parsed.steps[0].selectedLocator?.confidence).toBe(0.9);
  });

  it("rejects unvalidated model output", () => {
    expect(() => SemanticWorkflowSchema.parse({ id: "bad" })).toThrow();
  });
});

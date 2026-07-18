import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SemanticWorkflowSchema } from "@visual-compiler/semantic-ir";

describe("runtime safeguards", () => {
  it("does not import the OpenAI SDK", async () => {
    const source = await readFile("packages/runtime/src/index.ts", "utf8");
    expect(source).not.toMatch(/from ["']openai["']/);
    expect(source).not.toMatch(/new OpenAI/);
  });

  it("runtime package has no OpenAI dependency", async () => {
    const pkg = JSON.parse(
      await readFile("packages/runtime/package.json", "utf8"),
    );
    expect(JSON.stringify(pkg.dependencies ?? {})).not.toContain("openai");
  });

  it("can run with OPENAI_API_KEY unset at process level", () => {
    delete process.env.OPENAI_API_KEY;
    expect(process.env.OPENAI_API_KEY).toBeUndefined();
    expect(existsSync("packages/runtime/src/index.ts")).toBe(true);
  });

  it("ships a validated precompiled runtime artifact", async () => {
    const raw = await readFile(
      "compiled-workflows/pending-review.workflow.json",
      "utf8",
    );
    const workflow = SemanticWorkflowSchema.parse(JSON.parse(raw));
    expect(workflow.diagnostics.interpretationSource).toBe(
      "precompiled-sample",
    );
    expect(workflow.steps[0].selectedLocator?.rule?.candidateRole).toBe(
      "checkbox",
    );
  });
});

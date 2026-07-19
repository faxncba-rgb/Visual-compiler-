import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { chromium } from "playwright";
import { extractPageModel } from "@visual-compiler/page-model";
import {
  generateCandidates,
  selectBestCandidate,
} from "@visual-compiler/locator-engine";
import {
  SemanticWorkflowSchema,
  type SemanticStep,
  type SemanticWorkflow,
} from "@visual-compiler/semantic-ir";
import { nowIso } from "@visual-compiler/shared";
import { generatePlaywrightSource } from "./codegen.js";
import { interpretInstruction } from "./interpreter.js";

export type CompileOptions = {
  instruction: string;
  url: string;
  outPath?: string;
  headless?: boolean;
};

export async function compileWorkflow(
  options: CompileOptions,
): Promise<SemanticWorkflow> {
  const started = Date.now();
  const browser = await chromium.launch({ headless: options.headless ?? true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 820 },
  });
  await page.goto(options.url);
  const pageModel = await extractPageModel(page);
  await browser.close();

  const interpretation = await interpretInstruction(
    options.instruction,
    pageModel,
  );
  const steps = interpretation.result.steps.map((step) => {
    const candidates = generateCandidates(pageModel, step as SemanticStep);
    const selected = selectBestCandidate(candidates);
    return {
      ...step,
      candidates,
      selectedLocator: {
        kind: "semantic-rule" as const,
        primary: selected.selector,
        fallback: candidates[1]?.selector,
        rule: {
          anchorText: step.target.relations[0]?.anchorText,
          candidateRole: step.target.role as "checkbox" | "button" | undefined,
          candidateText: step.target.accessibleName,
          relation:
            step.target.relations[0]?.relation === "next-to"
              ? "nearest"
              : (step.target.relations[0]?.relation as
                  | "right-of"
                  | "left-of"
                  | "below"
                  | "above"
                  | "same-row"
                  | "same-column"
                  | "nearest"),
          ordinal: step.target.ordinal ?? 1,
          enabledOnly: step.target.state === "enabled",
          visibleOnly: true,
          color: step.target.iconColor,
        },
        confidence: selected.confidence,
        explanation: selected.explanation,
      },
    };
  });

  const workflowWithoutCode = {
    id: "pending-review.workflow",
    version: "0.1.0",
    name: interpretation.result.name,
    source: { url: options.url, viewport: pageModel.viewport },
    steps,
    compiledAt: nowIso(),
    compileModel: process.env.OPENAI_COMPILE_MODEL ?? "gpt-5.6",
    metadata: {
      compilerVersion: "0.1.0",
      targetUrl: options.url,
      validationVariant: "A",
    },
    diagnostics: {
      modelCalls: interpretation.modelCalls,
      interpretationSource: interpretation.source,
      responseModel: interpretation.responseModel,
      tokenUsage: interpretation.tokenUsage,
      warnings: interpretation.result.ambiguityWarnings,
      durationMs: Date.now() - started,
      rejected: false,
    },
  };
  const workflow = SemanticWorkflowSchema.parse({
    ...workflowWithoutCode,
    generatedPlaywright: generatePlaywrightSource(workflowWithoutCode),
  });

  if (options.outPath) {
    await mkdir(path.dirname(options.outPath), { recursive: true });
    const temporaryPath = path.join(
      path.dirname(options.outPath),
      `${path.basename(options.outPath)}.${randomUUID()}.tmp.json`,
    );
    try {
      await writeFile(temporaryPath, JSON.stringify(workflow, null, 2));
      await rename(temporaryPath, options.outPath);
    } finally {
      await rm(temporaryPath, { force: true });
    }
  }
  return workflow;
}

export {
  InterpreterResponseSchema,
  interpreterResponseFormat,
  mockInterpretInstruction,
  interpretInstructionWithOpenAI,
} from "./interpreter.js";

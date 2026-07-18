import OpenAI from "openai";
import { z } from "zod";
import type { PageModel } from "@visual-compiler/page-model";
import { SemanticStepSchema } from "@visual-compiler/semantic-ir";

const InterpreterResponseSchema = z.object({
  name: z.string(),
  assumptions: z.array(z.string()).default([]),
  ambiguityWarnings: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  expectedResult: z.string(),
  steps: z
    .array(SemanticStepSchema.omit({ candidates: true, selectedLocator: true }))
    .min(1),
});

export type InterpreterResponse = z.infer<typeof InterpreterResponseSchema>;

const interpreterJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "assumptions",
    "ambiguityWarnings",
    "confidence",
    "expectedResult",
    "steps",
  ],
  properties: {
    name: { type: "string" },
    assumptions: { type: "array", items: { type: "string" } },
    ambiguityWarnings: { type: "array", items: { type: "string" } },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    expectedResult: { type: "string" },
    steps: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: true,
        required: ["id", "action", "intent", "target"],
        properties: {
          id: { type: "string" },
          action: {
            enum: [
              "click",
              "check",
              "uncheck",
              "fill",
              "select",
              "wait",
              "assert",
            ],
          },
          intent: { type: "string" },
          target: { type: "object" },
          value: { type: "string" },
          preconditions: { type: "array" },
          postconditions: { type: "array" },
        },
      },
    },
  },
};

export function mockInterpretInstruction(): InterpreterResponse {
  return InterpreterResponseSchema.parse({
    name: "Pending review approval",
    assumptions: [
      "The first enabled checkbox to the right is selected in visual row order.",
    ],
    ambiguityWarnings: [
      "There are repeated Pending review labels; table row geometry disambiguates the target.",
    ],
    confidence: 0.91,
    expectedResult:
      "The enabled Pending review checkbox is checked and the confirmation status appears.",
    steps: [
      {
        id: "step-1",
        action: "check",
        intent:
          "Check the first enabled checkbox to the right of the Pending review status text.",
        target: {
          role: "checkbox",
          state: "enabled",
          ordinal: 1,
          relations: [
            {
              relation: "right-of",
              anchorText: "Pending review",
              tolerancePx: 24,
            },
          ],
        },
        preconditions: [
          {
            type: "element-enabled",
            target: "Pending review row checkbox",
            expected: true,
          },
        ],
        postconditions: [
          {
            type: "checkbox-state",
            target: "Pending review row checkbox",
            expected: true,
          },
        ],
      },
      {
        id: "step-2",
        action: "click",
        intent: "Click the green confirmation button below the requests table.",
        target: {
          role: "button",
          accessibleName: "Confirm selection",
          iconColor: "green",
          relations: [
            {
              relation: "below",
              anchorText: "Requests table",
              tolerancePx: 40,
            },
          ],
        },
        preconditions: [
          {
            type: "element-visible",
            target: "Confirm selection",
            expected: true,
          },
        ],
        postconditions: [
          {
            type: "text-visible",
            target: "Compiled workflow completed",
            expected: "Compiled workflow completed",
          },
        ],
      },
    ],
  });
}

export async function interpretInstructionWithOpenAI(
  instruction: string,
  model: PageModel,
): Promise<InterpreterResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for live GPT-5.6 compilation.");
  }
  const client = new OpenAI();
  const response = await client.responses.create({
    model: process.env.OPENAI_COMPILE_MODEL ?? "gpt-5.6",
    input: [
      {
        role: "system",
        content:
          "You are Visual Compiler's compile-time interpreter. Return strict JSON that matches the schema. Do not generate Playwright code.",
      },
      {
        role: "user",
        content: JSON.stringify({
          instruction,
          pageModel: {
            url: model.url,
            viewport: model.viewport,
            nodes: model.nodes.map((node) => ({
              id: node.id,
              role: node.role,
              accessibleName: node.accessibleName,
              text: node.text,
              box: node.box,
              visible: node.visible,
              enabled: node.enabled,
              checked: node.checked,
              color: node.color,
            })),
          },
        }),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "visual_compiler_interpretation",
        strict: true,
        schema: interpreterJsonSchema,
      },
    },
  });
  return InterpreterResponseSchema.parse(JSON.parse(response.output_text));
}

export async function interpretInstruction(
  instruction: string,
  model: PageModel,
) {
  if (process.env.USE_LIVE_OPENAI === "true") {
    return {
      result: await interpretInstructionWithOpenAI(instruction, model),
      source: "gpt-5.6" as const,
      modelCalls: 1,
    };
  }
  return {
    result: mockInterpretInstruction(),
    source: "mock" as const,
    modelCalls: 0,
  };
}

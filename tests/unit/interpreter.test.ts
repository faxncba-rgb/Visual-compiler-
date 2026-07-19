import { describe, expect, it } from "vitest";
import {
  interpreterResponseFormat,
  mockInterpretInstruction,
} from "@visual-compiler/compiler";
import { DEFAULT_INSTRUCTION } from "@visual-compiler/shared";

function expectStrictObjects(schema: unknown): void {
  if (!schema || typeof schema !== "object") return;
  const record = schema as Record<string, unknown>;
  if (record.type === "object") {
    expect(record.additionalProperties).toBe(false);
    expect(record.required).toEqual(
      Object.keys((record.properties as Record<string, unknown>) ?? {}),
    );
  }
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) value.forEach(expectStrictObjects);
    else expectStrictObjects(value);
  }
}

describe("GPT-5.6 interpreter response format", () => {
  it("generates a strict JSON schema for every nested object", () => {
    expect(interpreterResponseFormat.type).toBe("json_schema");
    expect(interpreterResponseFormat.strict).toBe(true);
    expectStrictObjects(interpreterResponseFormat.schema);
  });

  it("limits the offline mock to the documented fixture instruction", () => {
    expect(mockInterpretInstruction(DEFAULT_INSTRUCTION).steps).toHaveLength(2);
    expect(() =>
      mockInterpretInstruction(
        "Check the Invoice packet primary checkbox and confirm.",
      ),
    ).toThrow(/supports only the documented Pending review fixture/);
  });
});

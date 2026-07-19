import { describe, expect, it } from "vitest";
import { interpreterResponseFormat } from "@visual-compiler/compiler";

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
});

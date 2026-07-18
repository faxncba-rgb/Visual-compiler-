import { describe, expect, it } from "vitest";
import {
  generateCandidates,
  selectBestCandidate,
} from "@visual-compiler/locator-engine";
import type { PageModel } from "@visual-compiler/page-model";
import type { SemanticStep } from "@visual-compiler/semantic-ir";

const model: PageModel = {
  url: "http://local",
  viewport: { width: 800, height: 600 },
  capturedAt: new Date().toISOString(),
  nodes: [
    {
      id: "text",
      tagName: "span",
      text: "Pending review",
      accessibleName: "Pending review",
      visible: true,
      enabled: true,
      box: { x: 100, y: 100, width: 100, height: 20 },
      attributes: {},
    },
    {
      id: "disabled",
      tagName: "input",
      role: "checkbox",
      text: "",
      accessibleName: "disabled",
      visible: true,
      enabled: false,
      box: { x: 230, y: 100, width: 20, height: 20 },
      attributes: {},
    },
    {
      id: "enabled",
      tagName: "input",
      role: "checkbox",
      text: "",
      accessibleName: "enabled",
      visible: true,
      enabled: true,
      box: { x: 270, y: 100, width: 20, height: 20 },
      attributes: {},
    },
    {
      id: "second",
      tagName: "input",
      role: "checkbox",
      text: "",
      accessibleName: "second",
      visible: true,
      enabled: true,
      box: { x: 310, y: 100, width: 20, height: 20 },
      attributes: {},
    },
  ],
};

const step: SemanticStep = {
  id: "s1",
  action: "check",
  intent: "Check first enabled checkbox",
  target: {
    role: "checkbox",
    state: "enabled",
    ordinal: 1,
    relations: [
      { relation: "right-of", anchorText: "Pending review", tolerancePx: 24 },
    ],
  },
  preconditions: [],
  postconditions: [],
  candidates: [],
};

describe("locator engine", () => {
  it("excludes disabled targets and selects the first enabled right-of target", () => {
    const candidates = generateCandidates(model, step);
    expect(candidates.map((candidate) => candidate.node?.id)).toEqual([
      "enabled",
      "second",
    ]);
    expect(selectBestCandidate(candidates).selector).toContain("nth=1");
  });

  it("rejects ambiguous non-unique low quality targets", () => {
    expect(() =>
      selectBestCandidate([
        {
          strategy: "role-name",
          selector: "role=checkbox",
          confidence: 0.4,
          unique: false,
          stability: 0.4,
          explanation: "ambiguous",
          fallbackOrder: 0,
        },
      ]),
    ).toThrow();
  });
});

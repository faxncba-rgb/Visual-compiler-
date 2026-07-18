import type {
  LocatorCandidate,
  SemanticStep,
} from "@visual-compiler/semantic-ir";
import type { PageModel, PageNode } from "@visual-compiler/page-model";
import { candidateRoleNodes, findTextNodes } from "@visual-compiler/page-model";
import { filterByRelation, readingOrder } from "@visual-compiler/spatial";

export type ResolvedCandidate = LocatorCandidate & { node?: PageNode };

const strategyWeight: Record<LocatorCandidate["strategy"], number> = {
  "role-name": 1,
  "label-association": 0.94,
  "text-dom-relation": 0.88,
  "semantic-row-column": 0.84,
  "test-attribute": 0.78,
  "relative-dom": 0.7,
  "spatial-bounds": 0.64,
  "ocr-anchor": 0.45,
  "image-template": 0.4,
  "absolute-coordinate": 0.1,
};

export function rankCandidates(candidates: LocatorCandidate[]) {
  return [...candidates].sort((a, b) => {
    const scoreA =
      a.confidence * 0.45 +
      a.stability * 0.35 +
      (a.unique ? 0.2 : 0) +
      strategyWeight[a.strategy] * 0.1;
    const scoreB =
      b.confidence * 0.45 +
      b.stability * 0.35 +
      (b.unique ? 0.2 : 0) +
      strategyWeight[b.strategy] * 0.1;
    return scoreB - scoreA;
  });
}

export function generateCandidates(
  model: PageModel,
  step: SemanticStep,
): ResolvedCandidate[] {
  const relation = step.target.relations[0];
  const role =
    step.target.role ?? (step.action === "check" ? "checkbox" : "button");
  const nodes = candidateRoleNodes(model, role).filter((node) => {
    if (step.target.state === "enabled") return node.enabled;
    if (step.target.state === "disabled") return !node.enabled;
    return true;
  });

  if (step.target.accessibleName) {
    const matches = nodes.filter(
      (node) => node.accessibleName === step.target.accessibleName,
    );
    return matches.map((node, index) => ({
      strategy: "role-name",
      selector: `role=${role}[name="${step.target.accessibleName}"]`,
      confidence: matches.length === 1 ? 0.96 : 0.74,
      unique: matches.length === 1,
      stability: 0.95,
      explanation: "Stable accessibility role and name.",
      fallbackOrder: index,
      node,
    }));
  }

  if (relation?.anchorText) {
    const anchors = findTextNodes(model, relation.anchorText);
    const anchor = readingOrder(anchors).find(Boolean);
    if (!anchor) return [];
    const normalizedRelation =
      relation.relation === "next-to" ||
      relation.relation === "first" ||
      relation.relation === "second"
        ? "nearest"
        : relation.relation;
    const related = filterByRelation(anchor.box, nodes, normalizedRelation, {
      rowTolerance: relation.tolerancePx,
    }).filter((node) => node.enabled || step.target.state !== "enabled");
    const ordered =
      relation.relation === "right-of"
        ? [...related].sort((a, b) => a.box.x - b.box.x)
        : readingOrder(related);
    return ordered.map((node, index) => ({
      strategy:
        relation.relation === "same-row" || relation.relation === "same-column"
          ? "semantic-row-column"
          : "spatial-bounds",
      selector: `${role} ${relation.relation} "${relation.anchorText}" nth=${index + 1}`,
      confidence: index === 0 ? 0.9 : 0.78,
      unique: true,
      stability: 0.82,
      explanation: `Deterministic geometry: ${role} ${relation.relation} anchor text "${relation.anchorText}".`,
      fallbackOrder: index,
      node,
    }));
  }

  return nodes.map((node, index) => ({
    strategy: "role-name",
    selector: `role=${role}`,
    confidence: 0.5,
    unique: nodes.length === 1,
    stability: 0.6,
    explanation: "Fallback role-only candidate.",
    fallbackOrder: index,
    node,
  }));
}

export function selectBestCandidate(
  candidates: LocatorCandidate[],
  threshold = 0.62,
) {
  const ranked = rankCandidates(candidates);
  const best = ranked[0];
  if (!best) throw new Error("No locator candidates were generated.");
  if (!best.unique) throw new Error("The top locator candidate is not unique.");
  if (best.confidence < threshold)
    throw new Error(
      `Locator confidence ${best.confidence} is below threshold ${threshold}.`,
    );
  if (best.strategy === "absolute-coordinate")
    throw new Error(
      "Compilation rejected: only absolute coordinates were available.",
    );
  return best;
}

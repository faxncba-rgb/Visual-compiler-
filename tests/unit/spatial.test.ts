import { describe, expect, it } from "vitest";
import {
  filterByRelation,
  isBelow,
  isLeftOf,
  isRightOf,
  readingOrder,
  sameColumn,
  sameRow,
} from "@visual-compiler/spatial";

describe("spatial relations", () => {
  const a = { x: 10, y: 10, width: 20, height: 20 };
  const b = { x: 50, y: 12, width: 20, height: 20 };
  const c = { x: 12, y: 60, width: 20, height: 20 };

  it("detects directional relations", () => {
    expect(isLeftOf(a, b)).toBe(true);
    expect(isRightOf(b, a)).toBe(true);
    expect(isBelow(c, a)).toBe(true);
  });

  it("detects same row and same column", () => {
    expect(sameRow(a, b)).toBe(true);
    expect(sameColumn(a, c)).toBe(true);
  });

  it("sorts in reading order", () => {
    expect(
      readingOrder([
        { id: "b", box: b },
        { id: "c", box: c },
        { id: "a", box: a },
      ]).map((x) => x.id),
    ).toEqual(["a", "b", "c"]);
  });

  it("filters right-of candidates in the same visual row", () => {
    const result = filterByRelation(
      a,
      [
        { id: "b", box: b },
        { id: "c", box: c },
      ],
      "right-of",
    );
    expect(result.map((x) => x.id)).toEqual(["b"]);
  });
});

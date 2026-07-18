export type Box = { x: number; y: number; width: number; height: number };

export type SpatialOptions = {
  rowTolerance?: number;
  columnTolerance?: number;
};

export const center = (box: Box) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

export const isLeftOf = (a: Box, b: Box, tolerance = 0) =>
  a.x + a.width <= b.x + tolerance;
export const isRightOf = (a: Box, b: Box, tolerance = 0) =>
  a.x >= b.x + b.width - tolerance;
export const isAbove = (a: Box, b: Box, tolerance = 0) =>
  a.y + a.height <= b.y + tolerance;
export const isBelow = (a: Box, b: Box, tolerance = 0) =>
  a.y >= b.y + b.height - tolerance;

export const sameRow = (a: Box, b: Box, tolerance = 18) =>
  Math.abs(center(a).y - center(b).y) <= tolerance;

export const sameColumn = (a: Box, b: Box, tolerance = 28) =>
  Math.abs(center(a).x - center(b).x) <= tolerance;

export const distance = (a: Box, b: Box) => {
  const ac = center(a);
  const bc = center(b);
  return Math.hypot(ac.x - bc.x, ac.y - bc.y);
};

export const readingOrder = <T extends { box: Box }>(items: T[]) =>
  [...items].sort((a, b) => {
    const dy = a.box.y - b.box.y;
    if (Math.abs(dy) > 12) return dy;
    return a.box.x - b.box.x;
  });

export const nearestTo = <T extends { box: Box }>(anchor: Box, items: T[]) =>
  [...items].sort(
    (a, b) => distance(anchor, a.box) - distance(anchor, b.box),
  )[0];

export const filterByRelation = <T extends { box: Box }>(
  anchor: Box,
  items: T[],
  relation:
    | "right-of"
    | "left-of"
    | "below"
    | "above"
    | "same-row"
    | "same-column"
    | "nearest",
  options: SpatialOptions = {},
) => {
  const rowTolerance = options.rowTolerance ?? 22;
  const columnTolerance = options.columnTolerance ?? 34;
  const filtered = items.filter((item) => {
    if (relation === "right-of")
      return (
        isRightOf(item.box, anchor) && sameRow(item.box, anchor, rowTolerance)
      );
    if (relation === "left-of")
      return (
        isLeftOf(item.box, anchor) && sameRow(item.box, anchor, rowTolerance)
      );
    if (relation === "below") return isBelow(item.box, anchor);
    if (relation === "above") return isAbove(item.box, anchor);
    if (relation === "same-row") return sameRow(item.box, anchor, rowTolerance);
    if (relation === "same-column")
      return sameColumn(item.box, anchor, columnTolerance);
    return true;
  });
  return relation === "nearest"
    ? [nearestTo(anchor, filtered)].filter(Boolean)
    : filtered;
};

import type { Page } from "playwright";
import type { Box } from "@visual-compiler/spatial";

export type PageNode = {
  id: string;
  tagName: string;
  role?: string;
  accessibleName?: string;
  text: string;
  box: Box;
  visible: boolean;
  enabled: boolean;
  checked?: boolean;
  color?: "green" | "red" | "neutral" | "warning";
  attributes: Record<string, string>;
  parentId?: string;
};

export type PageModel = {
  url: string;
  viewport: { width: number; height: number };
  nodes: PageNode[];
  capturedAt: string;
};

export async function extractPageModel(page: Page): Promise<PageModel> {
  const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
  const nodes = await page.evaluate(() => {
    const roleFor = (el: Element) => {
      const explicit = el.getAttribute("role");
      if (explicit) return explicit;
      const tag = el.tagName.toLowerCase();
      if (tag === "button") return "button";
      if (tag === "input") {
        const type = (el as HTMLInputElement).type;
        if (type === "checkbox") return "checkbox";
        if (type === "text" || type === "email" || type === "search")
          return "textbox";
      }
      if (tag === "select") return "combobox";
      if (tag === "option") return "option";
      if (tag === "a") return "link";
      if (tag === "tr") return "row";
      if (tag === "td" || tag === "th") return "cell";
      if (tag === "table") return "table";
      return undefined;
    };
    const nameFor = (el: Element) => {
      const aria = el.getAttribute("aria-label");
      if (aria) return aria.trim();
      if (el instanceof HTMLInputElement) {
        const label = el.closest("label")?.textContent?.trim();
        if (label) return label;
      }
      return (el.textContent ?? "").replace(/\s+/g, " ").trim();
    };
    const path = (el: Element) => {
      const parts: string[] = [];
      let cur: Element | null = el;
      while (cur && cur !== document.body) {
        const index =
          Array.from(cur.parentElement?.children ?? []).indexOf(cur) + 1;
        parts.unshift(`${cur.tagName.toLowerCase()}:nth-child(${index})`);
        cur = cur.parentElement;
      }
      return parts.join(">");
    };
    const isEnabled = (el: Element) =>
      !(
        el instanceof HTMLButtonElement ||
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement
      ) || !el.disabled;
    const all = Array.from(document.querySelectorAll("body *"));
    return all
      .map((el, index) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const visible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none";
        const attrs: Record<string, string> = {};
        for (const attr of Array.from(el.attributes)) {
          if (["id", "class", "data-row-token"].includes(attr.name)) continue;
          attrs[attr.name] = attr.value;
        }
        const node = {
          id: `n${index + 1}`,
          tagName: el.tagName.toLowerCase(),
          role: roleFor(el),
          accessibleName: nameFor(el),
          text: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
          box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          visible,
          enabled: isEnabled(el),
          checked:
            el instanceof HTMLInputElement && el.type === "checkbox"
              ? el.checked
              : undefined,
          color:
            (el.getAttribute("data-icon-color") as
              "green" | "red" | "neutral" | "warning" | null) ?? undefined,
          attributes: attrs,
          parentPath: el.parentElement ? path(el.parentElement) : undefined,
        };
        return node;
      })
      .filter(
        (node) =>
          node.visible || ["input", "button", "select"].includes(node.tagName),
      );
  });
  return {
    url: page.url(),
    viewport,
    nodes,
    capturedAt: new Date().toISOString(),
  };
}

export const findTextNodes = (model: PageModel, text: string) =>
  model.nodes.filter(
    (node) =>
      node.visible && (node.text === text || node.accessibleName === text),
  );

export const candidateRoleNodes = (model: PageModel, role: string) =>
  model.nodes.filter((node) => node.visible && node.role === role);

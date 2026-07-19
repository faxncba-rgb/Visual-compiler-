import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("production deployment configuration", () => {
  it("pins the container browser image to the exact project Playwright version", async () => {
    const packageJson = JSON.parse(await readFile("package.json", "utf8"));
    const dockerfile = await readFile("Dockerfile", "utf8");

    expect(packageJson.dependencies.playwright).toBe("1.61.1");
    expect(packageJson.dependencies["@playwright/test"]).toBe("1.61.1");
    expect(dockerfile).toContain("mcr.microsoft.com/playwright:v1.61.1-noble");
  });

  it("keeps browser and server demo URLs separate with persistent storage", async () => {
    const compose = await readFile("compose.production.yml", "utf8");

    expect(compose).toContain('DEMO_SITE_INTERNAL_URL: "http://demo:4173"');
    expect(compose).toContain('DEMO_SITE_PUBLIC_URL: "https://${DEMO_DOMAIN:');
    expect(compose).toContain("workflows:/app/compiled-workflows");
    expect(compose).not.toMatch(/ports:/);
  });
});

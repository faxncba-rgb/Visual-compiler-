import express from "express";
import { renderDemoPage, type DemoVariant } from "./renderDemoPage.js";

export function createDemoServer(port = Number(process.env.DEMO_PORT ?? 4173)) {
  const app = express();

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/", (req, res) => {
    const variant = req.query.variant === "B" ? "B" : "A";
    res.redirect(`/demo?variant=${variant}`);
  });
  app.get("/demo", (req, res) => {
    const variant: DemoVariant = req.query.variant === "B" ? "B" : "A";
    res.type("html").send(renderDemoPage(variant));
  });

  const server = app.listen(port, () => {
    console.log(
      `Demo site listening on http://127.0.0.1:${port}/demo?variant=A`,
    );
  });

  return { app, server };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoServer();
}

export const DEFAULT_DEMO_URL =
  process.env.DEMO_SITE_URL ?? "http://127.0.0.1:4173";
export const DEFAULT_INSTRUCTION =
  "In the row containing 'Pending review', check the first enabled checkbox to the right of the status text, then click the green confirmation button below the table.";

export const WORKFLOW_PATH = "compiled-workflows/pending-review.workflow.json";

export const nowIso = () => new Date().toISOString();

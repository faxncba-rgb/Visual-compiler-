export type DemoVariant = "A" | "B";

const rowsA = [
  ["Invoice packet", "Ready", false, true],
  ["Insurance document", "Pending review", false, false],
  ["Vendor proof", "Pending review", true, false],
  ["Tax certificate", "Archived", false, true],
] as const;

const rowsB = [
  ["Vendor proof", "Pending review", true, false],
  ["Tax certificate", "Archived", false, true],
  ["Insurance document", "Pending review", false, false],
  ["Invoice packet", "Ready", false, true],
] as const;

const icon = (color: "green" | "red" | "neutral" | "warning", label: string) =>
  `<span role="img" aria-label="${label}" class="status-icon tone-${color}" data-icon-color="${color}"></span>`;

export function renderDemoPage(variant: DemoVariant) {
  const rows = variant === "A" ? rowsA : rowsB;
  const nonce = Math.random().toString(36).slice(2, 8);
  const variantClass = variant === "A" ? "grid-a" : "grid-b";
  const tableRows = rows
    .map(([documentName, status, firstDisabled, secondDisabled], index) => {
      const color =
        status === "Ready"
          ? "green"
          : status === "Pending review"
            ? "warning"
            : "neutral";
      const generatedId = `vc_${variant}_${nonce}_${index}`;
      const className = `row-${nonce}-${index}`;
      return `
        <tr class="${className}" data-row-token="${generatedId}">
          <td class="doc-cell">${icon(color, `${status} status`)}<span>${documentName}</span></td>
          <td class="status-cell"><span class="status-text">${status}</span></td>
          <td><input aria-label="${documentName} primary checkbox" type="checkbox" ${firstDisabled ? "disabled" : ""}></td>
          <td><input aria-label="${documentName} secondary checkbox" type="checkbox" ${secondDisabled ? "disabled" : ""}></td>
          <td><button ${status === "Archived" ? "disabled" : ""}>Review</button></td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Visual Compiler Demo ${variant}</title>
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      html { -webkit-text-size-adjust: 100%; }
      body { margin: 0; background: #f5f7fb; color: #172033; }
      main { max-width: 1080px; margin: 0 auto; padding: 28px; }
      header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
      h1 { margin: 0; font-size: 24px; letter-spacing: 0; }
      .variant { border: 1px solid #c9d3e8; padding: 7px 10px; background: #fff; border-radius: 6px; font-weight: 650; }
      .challenge-board { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }
      .panel { background: #fff; border: 1px solid #d9e1ef; border-radius: 8px; box-shadow: 0 8px 28px rgba(23, 32, 51, 0.08); }
      .panel-inner { padding: 18px; }
      .icon-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
      .icon-card { border: 1px solid #d9e1ef; border-radius: 6px; padding: 14px; min-height: 72px; display: grid; gap: 8px; }
      .icon-label { color: #52627a; font-size: 13px; }
      .status-icon { width: 16px; height: 16px; display: inline-block; border-radius: 50%; box-shadow: inset 0 0 0 2px rgba(0,0,0,.08); }
      .tone-green { background: #1fa463; }
      .tone-red { background: #c93838; }
      .tone-neutral { background: #9aa6b2; }
      .tone-warning { background: #d79b28; clip-path: polygon(50% 0%, 0% 100%, 100% 100%); border-radius: 2px; }
      table { width: 100%; border-collapse: collapse; }
      .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      caption { text-align: left; font-weight: 700; padding: 14px 16px; color: #243044; }
      th, td { padding: 13px 16px; border-top: 1px solid #e3e9f4; text-align: left; vertical-align: middle; }
      th { color: #65738a; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
      .doc-cell { display: flex; align-items: center; gap: 9px; }
      input[type="checkbox"] { width: 18px; height: 18px; accent-color: #1f8f5a; }
      button { border: 1px solid #bcc8da; background: #fff; border-radius: 6px; padding: 8px 12px; font-weight: 650; color: #243044; }
      button:disabled, input:disabled { opacity: .42; }
      .confirm-zone { display: flex; justify-content: ${variant === "A" ? "flex-end" : "center"}; padding: 18px 16px 20px; border-top: 1px solid #e3e9f4; }
      .confirm { background: #1f8f5a; color: white; border-color: #167048; }
      .aside { display: grid; gap: 14px; }
      .stack { display: grid; gap: ${variant === "A" ? "10px" : "18px"}; }
      .warning-block { border: 1px dashed #d79b28; border-radius: 6px; padding: 12px; display: grid; gap: 8px; }
      .warning-block button { width: fit-content; }
      .grid-b .icon-grid { grid-template-columns: 1fr 1fr; }
      .grid-b table td:nth-child(3), .grid-b table td:nth-child(4) { padding-left: 24px; }
      #result { margin-top: 14px; min-height: 22px; font-weight: 700; color: #146b43; }
      @media (max-width: 760px) {
        main { padding: 14px; }
        header { align-items: flex-start; gap: 12px; }
        h1 { font-size: 20px; }
        .challenge-board { grid-template-columns: 1fr; }
        .icon-grid, .grid-b .icon-grid { grid-template-columns: 1fr; }
        table { min-width: 720px; }
        button, input[type="checkbox"] { min-height: 44px; }
        .confirm-zone { justify-content: stretch; }
        .confirm { width: 100%; }
      }
    </style>
  </head>
  <body>
    <main class="${variantClass}">
      <header>
        <h1>Visual Compiler spatial challenge</h1>
        <div class="variant">Layout variant ${variant}</div>
      </header>
      <section class="challenge-board">
        <div class="panel">
          <div class="panel-inner">
            <div class="icon-grid" aria-label="status cards">
              <div class="icon-card">${icon("neutral", "neutral status")}<span class="icon-label">Draft package</span><input aria-label="Draft package opt in" type="checkbox"></div>
              <div class="icon-card">${icon("green", "green status")}<span class="icon-label">Approved request</span><input aria-label="Approved request opt in" type="checkbox"></div>
              <div class="icon-card">${icon("red", "red status")}<span class="icon-label">Rejected request</span><input aria-label="Rejected request opt in" type="checkbox"></div>
            </div>
          </div>
          <div class="table-scroll" tabindex="0" aria-label="Scrollable requests table">
            <table aria-label="Requests table">
              <caption>Requests table</caption>
              <thead>
                <tr><th>Document</th><th>Status text</th><th>Primary</th><th>Secondary</th><th>Action</th></tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
          <div class="confirm-zone"><button class="confirm" aria-label="Confirm selection">Confirm selection</button></div>
          <div class="panel-inner"><div id="result" role="status" aria-live="polite"></div></div>
        </div>
        <aside class="aside">
          <div class="panel panel-inner stack">
            <strong>Repeated labels</strong>
            <label><input type="checkbox"> Pending review</label>
            <label>Pending review <input type="checkbox"></label>
          </div>
          <div class="panel panel-inner warning-block">
            ${icon("warning", "warning icon")}
            <span>Insurance document</span>
            <button aria-label="Resolve Insurance document warning">Resolve warning</button>
          </div>
        </aside>
      </section>
    </main>
    <script>
      document.querySelector(".confirm").addEventListener("click", () => {
        const checked = Array.from(document.querySelectorAll("tbody input[type=checkbox]")).some((input) => input.checked);
        document.getElementById("result").textContent = checked ? "Compiled workflow completed" : "Select an enabled checkbox first";
      });
    </script>
  </body>
</html>`;
}

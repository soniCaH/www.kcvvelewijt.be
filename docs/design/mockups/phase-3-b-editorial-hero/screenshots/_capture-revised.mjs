import { chromium } from "/Users/kevinvanransbeeck/Sites/KCVV/kcvv-issue-1525/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..");

const variant = process.argv[2];
const placement = process.argv[3] ?? "detail";
if (!variant) {
  console.error("usage: node _capture-revised.mjs <variant> [detail|homepage]");
  process.exit(1);
}

const variantSections = {
  announcement: [
    { id: "detail-no-cover", suffix: "primary" },
    { id: "detail-with-cover", suffix: "secondary" },
  ],
  transfer: [
    { id: "in-hero-quote", suffix: "option-a" },
    { id: "in-body-quote", suffix: "option-b" },
    { id: "direction-matrix", suffix: "matrix" },
    { id: "mobile-preview", suffix: "mobile" },
  ],
  event: placement === "compare"
    ? [
        { id: "q4-cover", suffix: "q4" },
        { id: "q1-strip", suffix: "q1" },
        { id: "q2-sessions", suffix: "q2" },
        { id: "q3-event-doc", suffix: "q3" },
      ]
    : [
        { id: "single-day-full", suffix: "single-day" },
        { id: "recurring-sessions", suffix: "recurring" },
        { id: "no-ticket-url", suffix: "no-ticket" },
        { id: "mobile-preview", suffix: "mobile" },
      ],
  interview: placement === "compare"
    ? [
        { id: "q1-subjects-placement", suffix: "q1" },
        { id: "q2-subject-counts", suffix: "q2" },
        { id: "q2b-mobile-counts", suffix: "q2b" },
      ]
    : [
        { id: "single-subject", suffix: "n1" },
        { id: "duo-subjects", suffix: "n2" },
        { id: "rare-counts-mobile", suffix: "rare-mobile" },
      ],
};
const sections = variantSections[variant] ?? [];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
const fileName = placement === "detail"
  ? `option-a-${variant}-detail.html`
  : placement === "compare"
    ? `option-a-${variant}-comparisons.html`
    : `option-a-${variant}-revised.html`;
const url = "file://" + path.join(dir, fileName);
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(async () => {
  await Promise.all(
    Array.from(document.images).map((img) =>
      img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; })
    )
  );
});
await page.waitForTimeout(500);
// Full page
const prefix = placement === "detail" ? `detail-${variant}` : placement === "compare" ? `compare-${variant}` : `revised-${variant}`;
await page.screenshot({
  path: path.join(__dirname, `${prefix}-full.png`),
  fullPage: true,
});
console.log(`✓ ${prefix}-full.png`);
for (const { id, suffix } of sections) {
  const el = await page.$(`#${id}`);
  if (!el) {
    console.warn(`  ! missing #${id}`);
    continue;
  }
  // Compute element rect in document coords (not viewport), then clip the full page.
  const rect = await el.evaluate((node) => {
    const r = node.getBoundingClientRect();
    const x = r.left + window.scrollX;
    const y = r.top + window.scrollY;
    return { x, y, width: r.width, height: r.height };
  });
  if (!rect || rect.width === 0 || rect.height === 0) {
    console.warn(`  ! could not measure #${id}`);
    continue;
  }
  await page.screenshot({
    path: path.join(__dirname, `${prefix}-${suffix}.png`),
    fullPage: true,
    clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
  });
  console.log(`  ✓ ${prefix}-${suffix}.png`);
}
await browser.close();

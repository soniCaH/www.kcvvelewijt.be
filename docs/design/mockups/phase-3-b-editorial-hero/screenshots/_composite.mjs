import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const variants = ["transfer", "match-preview", "interview", "event", "announcement"];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1800, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

for (const v of variants) {
  const html = `<!doctype html><html><head><style>
  body { margin: 0; padding: 24px; background: #ddd6c4; font-family: ui-monospace, monospace; }
  .row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: start; }
  figure { margin: 0; background: #f5f1e6; border: 1px solid #888; padding: 12px; }
  figcaption { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 0 8px; color: #333; }
  img { width: 100%; height: auto; display: block; }
  h1 { font-family: Georgia, serif; font-size: 22px; margin: 0 0 16px; }
</style></head><body>
  <h1>Variant — ${v.toUpperCase()}</h1>
  <div class="row">
    <figure><figcaption>A · Asymmetric Broadsheet</figcaption><img src="option-a-${v}.png" /></figure>
    <figure><figcaption>B · Stacked Poster</figcaption><img src="option-b-${v}.png" /></figure>
    <figure><figcaption>C · Cover Frame</figcaption><img src="option-c-${v}.png" /></figure>
  </div>
</body></html>`;
  const tmp = path.join(__dirname, `_tmp-${v}.html`);
  fs.writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(__dirname, `compare-${v}.png`),
    fullPage: true,
  });
  fs.unlinkSync(tmp);
  console.log(`✓ compare-${v}.png`);
}

await browser.close();

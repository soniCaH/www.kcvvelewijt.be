import { chromium } from "/Users/kevinvanransbeeck/Sites/KCVV/kcvv-issue-1525/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..");

const options = [
  { slug: "a", file: "option-a-asymmetric-broadsheet.html", variantSelectorTpl: '#variant-{slug}' },
  { slug: "b", file: "option-b-stacked-poster.html", variantSelectorTpl: '#{slug}' },
  { slug: "c", file: "option-c-cover-frame.html", variantSelectorTpl: '#v-{slug}' },
];

const variants = ["transfer", "match-preview", "interview", "event", "announcement"];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

for (const opt of options) {
  const page = await context.newPage();
  const url = "file://" + path.join(dir, opt.file);
  await page.goto(url, { waitUntil: "networkidle" });
  // Full page
  await page.screenshot({
    path: path.join(__dirname, `option-${opt.slug}-full.png`),
    fullPage: true,
  });
  console.log(`✓ option-${opt.slug}-full.png`);

  // Per-variant
  for (const v of variants) {
    const sel = opt.variantSelectorTpl.replace("{slug}", v);
    const el = await page.$(sel);
    if (!el) {
      console.warn(`  ! missing ${sel} in ${opt.file}`);
      continue;
    }
    await el.screenshot({
      path: path.join(__dirname, `option-${opt.slug}-${v}.png`),
    });
    console.log(`  ✓ option-${opt.slug}-${v}.png`);
  }
  await page.close();
}

await browser.close();
console.log("Done.");

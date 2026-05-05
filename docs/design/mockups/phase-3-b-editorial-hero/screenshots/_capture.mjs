import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..");

const options = [
  { slug: "a", file: "option-a-asymmetric-broadsheet.html", variantSelectorTpl: '#variant-{slug}' },
  { slug: "b", file: "option-b-stacked-poster.html", variantSelectorTpl: '#{slug}' },
  { slug: "c", file: "option-c-cover-frame.html", variantSelectorTpl: '#v-{slug}' },
];

// `match-preview` deferred to issue #1470 — no longer a Phase 3 B variant.
// Removed from the capture loop; Direction A's section was excised on
// 2026-05-06 and Directions B/C have it banner-marked as deferred.
const variants = ["transfer", "interview", "event", "announcement"];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

for (const opt of options) {
  const page = await context.newPage();
  const url = pathToFileURL(path.join(dir, opt.file)).href;
  await page.goto(url, { waitUntil: "networkidle" });
  // Wait for fonts + images to settle so the screenshot captures
  // final glyph metrics + remote artwork rather than fallback fonts
  // or broken-image placeholders.
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete
          ? null
          : new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            })
      )
    );
  });
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

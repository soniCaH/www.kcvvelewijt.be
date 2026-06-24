import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VERIFY = path.join(HERE, "_verify");

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
await page.setViewportSize({ width: 1180, height: 900 });

const url = pathToFileURL(path.join(HERE, "compare.html")).href;
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

// full page
await page.screenshot({ path: path.join(VERIFY, "bold_fullpage.png"), fullPage: true });

// per-option sections
const sections = await page.$$("section.version");
const names = ["a1-faithful", "a2-retro"];
for (let i = 0; i < sections.length; i++) {
  await sections[i].screenshot({ path: path.join(VERIFY, `bold_${names[i]}.png`) });
}

// close-up of each footer crest (the BOLD, large one)
const footCrests = await page.$$(".footer-crest");
for (let i = 0; i < footCrests.length; i++) {
  await footCrests[i].screenshot({ path: path.join(VERIFY, `bold_crest_${names[i]}.png`) });
}

await browser.close();
console.log("screenshots written to", VERIFY);

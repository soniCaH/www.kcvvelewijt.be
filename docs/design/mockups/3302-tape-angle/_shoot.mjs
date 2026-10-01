// #3302 — before/after of the two-tier tilt scale, injected on production.
// Run from apps/web (resolves playwright): node ../../docs/design/mockups/3302-tape-angle/_shoot.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "shots");
const BASE = "https://kcvv-nextjs.vercel.app";
const SLIGHT = ["-1deg", "-0.5deg", "0.5deg", "1deg"]; // card lean, a..d
const TAPE = { a: "-6deg", b: "-2deg", c: "4deg", d: "6deg" }; // tape; 4 of the 6 proposed values

function after([slight, tape]) {
  const root = document.documentElement.style;
  ["a", "b", "c", "d"].forEach((k, i) => root.setProperty(`--rotate-tape-${k}`, slight[i]));
  // a strip resolves its own var, so a local override splits tape from card
  document.querySelectorAll("span[data-rotation]").forEach((s) => {
    const k = s.dataset.rotation;
    if (tape[k]) s.style.setProperty(`--rotate-tape-${k}`, tape[k]);
  });
  // youth tapes are all "a" today; a cycle stands in for an identity hash
  document.querySelectorAll('[data-testid="youth-team-card"]').forEach((c, i) => {
    const s = c.querySelector("span[data-rotation]");
    if (s) s.style.setProperty("--rotate-tape-a", tape[["a", "c", "b", "d"][i % 4]]);
    const card = c.firstElementChild;
    if (card) card.style.setProperty("--card-rest-rotation", slight[(i * 3 + 1) % 4]);
  });
}

const pages = [
  { id: "nieuws", path: "/nieuws", anchor: "article[data-rotation]" },
  { id: "jeugd", path: "/jeugd", anchor: '[data-testid="youth-team-card"]' },
];

const browser = await chromium.launch();
for (const vp of [{ w: 1280, h: 900 }, { w: 375, h: 812 }]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2 });
  for (const pg of pages) {
    await page.goto(BASE + pg.path, { waitUntil: "load", timeout: 60_000 });
    await page.waitForSelector(pg.anchor, { timeout: 30_000 });
    await page.addStyleTag({ content: "*{transition:none!important;animation:none!important}" });
    await page.evaluate((sel) => {
      const e = document.querySelector(sel);
      window.scrollTo(0, window.scrollY + e.getBoundingClientRect().top - 140);
    }, pg.anchor);
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(OUT, `${pg.id}-${vp.w}-before.png`) });
    await page.evaluate(after, [SLIGHT, TAPE]);
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(OUT, `${pg.id}-${vp.w}-after.png`) });
    console.log("shot", pg.id, vp.w);
  }
  await page.close();
}
await browser.close();

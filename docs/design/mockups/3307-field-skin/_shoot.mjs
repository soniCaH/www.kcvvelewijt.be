// #3307 — one resting skin for a typed-value field, injected on production.
// Run from apps/web (resolves playwright): node ../../docs/design/mockups/3307-field-skin/_shoot.mjs
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DIR = dirname(fileURLToPath(import.meta.url));
const BASE = "https://kcvv-nextjs.vercel.app";
const INK = "rgb(10, 10, 10)";
// a = production; b = the primitives' skin everywhere; c = the shared ink skin everywhere
const SKINS = {
  a: null,
  b: { bg: "#fff", border: "rgba(10,10,10,0.3)", shadow: "4px 4px 0 0 #6b6b6b", sans: true },
  c: { bg: "var(--color-cream)", border: INK, shadow: `4px 4px 0 0 ${INK}`, sans: false },
};
// each surface returns the skin boxes (the element that carries border + shadow)
const SURFACES = {
  "word-lid": { path: "/club/word-lid", boxes: `() => [...document.querySelectorAll("main input.font-body, main select.font-body")]` },
  zoeken: { path: "/zoeken", boxes: `() => [document.querySelector("main input[aria-label=Zoekterm]").closest("form")]` },
  hulp: { path: "/hulp", boxes: `() => [document.querySelector("main input[role=combobox]").parentElement]` },
  kalender: {
    path: "/kalender",
    open: async (p) => {
      await p.locator("button[aria-expanded]", { hasText: "Abonneer" }).first().click();
      await p.waitForTimeout(400);
      // every team starts selected, which hides the picker; drop the last chip to show it
      const chips = p.locator("main button[aria-label^='Verwijder']");
      await chips.last().click();
      await p.waitForTimeout(300);
    },
    boxes: `() => [document.querySelector("main select[aria-label='Team toevoegen']")]`,
  },
};

function apply([src, skin]) {
  const boxes = eval(src)();
  document.activeElement?.blur();
  const text = (b) => (b.matches("input,select") ? b : b.querySelector("input"));
  for (const b of skin ? boxes : []) {
    b.style.setProperty("background-color", skin.bg, "important");
    b.style.setProperty("border-color", skin.border, "important");
    b.style.setProperty("border-width", "2px", "important");
    b.style.setProperty("box-shadow", skin.shadow, "important");
    if (skin.sans) {
      const t = text(b);
      t.style.setProperty("font-family", "var(--font-body)", "important");
      t.style.setProperty("font-size", "16px", "important");
      t.style.setProperty("font-weight", "400", "important");
    }
  }
  const b = boxes[0], c = getComputedStyle(b), t = getComputedStyle(text(b));
  return { bg: c.backgroundColor, border: `${c.borderTopWidth} ${c.borderTopColor}`, shadow: c.boxShadow.split(", rgb").pop(), font: `${t.fontFamily.split(",")[0]} ${t.fontSize}`, h: Math.round(b.getBoundingClientRect().height) };
}

function clipFor([src, slug]) {
  const rs = eval(src)().map((b) => b.getBoundingClientRect());
  let top = rs[0].top - 120, bottom = rs[0].bottom + 60;
  if (slug === "word-lid") { top = rs[0].top - 140; bottom = rs[Math.min(rs.length - 1, 4)].bottom + 60; }
  return { x: 0, y: Math.max(0, top + scrollY), width: innerWidth, height: bottom - top };
}

const data = {};
const browser = await chromium.launch();
for (const w of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
  for (const [slug, s] of Object.entries(SURFACES)) {
    for (const [id, skin] of Object.entries(SKINS)) {
      await page.goto(BASE + s.path, { waitUntil: "networkidle", timeout: 60_000 });
      await page.addStyleTag({ content: "*{transition:none!important;animation:none!important;caret-color:transparent!important} header[class*=sticky]{position:static!important}" });
      if (s.open) await s.open(page);
      const m = await page.evaluate(apply, [s.boxes, skin]);
      await page.mouse.move(0, 0);
      await page.waitForTimeout(300);
      (data[slug] ??= {})[`${id}-${w}`] = m;
      const clip = await page.evaluate(clipFor, [s.boxes, slug]);
      await page.screenshot({ path: join(DIR, "shots", `${slug}-${w}-${id}.png`), clip, fullPage: true });
      console.log(slug, w, id, JSON.stringify(m));
    }
  }
  await page.close();
}
await browser.close();
writeFileSync(join(DIR, "data.json"), JSON.stringify(data, null, 1));

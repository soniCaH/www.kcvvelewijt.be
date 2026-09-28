// #3239 — throwaway prototype. Injects each option as CSS on the REAL
// production homepage at a phone viewport, measures page height and contrast,
// and crops screenshots. Run: node docs/design/mockups/3239-type-and-length/_shoot.mjs
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "shots");
mkdirSync(OUT, { recursive: true });
const BASE = "https://kcvv-nextjs.vercel.app/";

// Tags the three targets with data-proto so option CSS stays short.
const TAG = () => {
  // Sticky header would cover element screenshots; hidden (space kept) in shots only.
  [...document.querySelectorAll("header, div")].filter((e) => ["sticky", "fixed"].includes(getComputedStyle(e).position) && e.getBoundingClientRect().top <= 0 && e.offsetHeight > 40).forEach((e) => e.setAttribute("data-proto-hdr", ""));
  const news = document.querySelector('a[aria-label="Meetrainen met de plezantste compagnie"]')?.closest("ul");
  news?.setAttribute("data-proto", "news");
  news?.closest("section")?.setAttribute("data-proto-sec", "news");
  const ft = document.querySelector('section[aria-label="Eerste ploegen"]');
  ft?.setAttribute("data-proto-sec", "ft");
  ft?.querySelectorAll(".text-warm").forEach((e) => { if (e.offsetParent && e.textContent.trim() === "Volgende") e.parentElement.setAttribute("data-proto", "stub"); });
  const ev = document.querySelector('section[aria-label="Aanstaand evenement"]');
  ev?.setAttribute("data-proto-sec", "ev");
  [...(ev?.querySelectorAll("span") ?? [])].find((s) => s.textContent.trim() === "AANSTAAND EVENEMENT")?.setAttribute("data-proto", "kicker");
};

const N = '[data-proto="news"]';
const ITEMS = [
  {
    id: "length", title: "Laatste nieuws on a phone", sec: "news", target: null,
    options: [
      { key: "today", name: "Today", note: "Six full cards, one per row, each ≈350px tall.", css: "" },
      { key: "A", name: "A · Compact cards", note: "Same card, laid out sideways below 640px: a square photo on the left, kicker + title + date on the right. 'Lees verder' is hidden (the whole card is the link).",
        css: `@media (max-width:639px){${N}{gap:12px}${N} article{flex-direction:row}${N} article>div:first-of-type{width:112px;flex-shrink:0;aspect-ratio:1/1;align-self:stretch}${N} article>div:nth-of-type(2){border-top:0;border-left:1px solid #0a0a0a;padding:12px;gap:8px}${N} h3{font-size:18px;line-height:1.15}${N} article>div:nth-of-type(2)>div:last-child{border-top:0;padding-top:0}${N} .reveal-on-hover{display:none}}` },
      { key: "B", name: "B · Text rows", note: "No photo below 640px: kicker, title and date in a bordered row. The photos stay on tablet and desktop.",
        css: `@media (max-width:639px){${N}{gap:8px}${N} article>div:first-of-type{display:none}${N} article>div:nth-of-type(2){border-top:0;padding:12px 14px;gap:6px}${N} h3{font-size:18px;line-height:1.15}${N} article>div:nth-of-type(2)>div:last-child{border-top:0;padding-top:0}${N} .reveal-on-hover{display:none}}` },
    ],
  },
  {
    id: "stub", title: "“Volgende” in the Eerste ploegen band", sec: "ft", target: '[data-proto="stub"]',
    options: [
      { key: "today", name: "Today", note: "9px, warm yellow on the green match-day ground.", css: "" },
      { key: "A", name: "A · 11px, same yellow", note: "Two pixels bigger. Colour unchanged.", css: `[data-proto="stub"]{font-size:11px!important}` },
      { key: "B", name: "B · 11px, cream", note: "Two pixels bigger, and cream like the team names beside it. The yellow accent is gone.", css: `[data-proto="stub"]{font-size:11px!important}[data-proto="stub"] *{color:#f5f1e6!important}` },
    ],
  },
  {
    id: "kicker", title: "“AANSTAAND EVENEMENT” kicker", sec: "ev", target: '[data-proto="kicker"]',
    options: [
      { key: "today", name: "Today", note: "13px, black ink on green.", css: "" },
      { key: "A", name: "A · Cream text", note: "Same size, cream instead of ink.", css: `[data-proto="kicker"]{color:#f5f1e6!important}` },
      { key: "B", name: "B · Ink on a cream label", note: "Ink stays, on a small cream label box, like a taped tag.", css: `[data-proto="kicker"]{background:#f5f1e6;padding:4px 6px;width:fit-content}` },
    ],
  },
];

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
// Trigger lazy images, then return to the top.
for (let y = 0; y < 11000; y += 700) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
await page.evaluate(TAG);

const data = [];
for (const item of ITEMS) {
  const res = { id: item.id, title: item.title, options: [] };
  for (const opt of item.options) {
    await page.evaluate((css) => {
      document.getElementById("__proto_css")?.remove();
      const s = document.createElement("style"); s.id = "__proto_css"; s.textContent = "[data-proto-hdr]{visibility:hidden!important}" + css; document.head.append(s);
    }, opt.css);
    await page.waitForTimeout(300);
    const m = await page.evaluate(({ sec, target }) => {
      const lum = (rgb) => { const [r, g, bb] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * bb; };
      const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (!/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; } return "rgb(255,255,255)"; };
      const s = document.querySelector(`[data-proto-sec="${sec}"]`);
      const out = { pageH: document.documentElement.scrollHeight, secH: s.offsetHeight };
      if (target) {
        const t = document.querySelector(target);
        const leaf = t.querySelector(".text-warm, [class*=text-cream]") || [...t.querySelectorAll("*")].find((e) => !e.children.length && e.textContent.trim()) || t;
        const fg = getComputedStyle(leaf).color, bg = bgOf(leaf);
        const [l1, l2] = [lum(fg), lum(bg)].sort((a, c) => c - a);
        Object.assign(out, { fs: getComputedStyle(leaf).fontSize, ratio: Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100 });
      }
      return out;
    }, { sec: item.sec, target: item.target });
    const loc = page.locator(`[data-proto-sec="${item.sec}"]`);
    await loc.scrollIntoViewIfNeeded();
    const file = `${item.id}-${opt.key}.png`;
    if (item.target) {
      // Close crop: the band's first 420px holds the rows with the target.
      const box = await page.locator(item.target).first().boundingBox();
      const secBox = await loc.boundingBox();
      await page.screenshot({ path: join(OUT, file), clip: { x: 0, y: Math.max(secBox.y, box.y - 150), width: 375, height: 320 } });
    } else {
      await loc.screenshot({ path: join(OUT, file) });
    }
    res.options.push({ ...opt, css: undefined, ...m, file });
    console.log(item.id, opt.key, JSON.stringify(m));
  }
  data.push(res);
}
writeFileSync(join(HERE, "data.json"), JSON.stringify(data, null, 2));
await b.close();

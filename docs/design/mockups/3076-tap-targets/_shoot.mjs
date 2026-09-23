// #3076 — throwaway prototype. Injects each fix option as CSS on the REAL
// production page, measures the real hit area with elementFromPoint, marks
// where a hit area lands on a neighbour, and crops screenshots at 375/1280.
// Run: node docs/design/mockups/3076-tap-targets/_shoot.mjs   (writes shots/ + data.json)
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "shots");
mkdirSync(OUT, { recursive: true });
const BASE = "https://kcvv-nextjs.vercel.app";

const each = (sel, tpl) => sel.split(",").map((x) => tpl(x.trim())).join("\n");
const hit44 = (sel) => each(sel, (s) => `${s}{position:relative}\n${s}::before{content:"";position:absolute;inset:calc(50% - 22px)}`);

// ---- the five controls, their options, and how to reach them ------------------------------
const CONTROLS = [
  {
    id: "1-contactcard", title: "1 · Contact card — E-mail / Bel", page: "/hulp",
    where: "Under an opened answer on /hulp. Phones: yes.",
    sel: '#hulp a[aria-label^="E-mail"], #hulp a[aria-label^="Bel "]',
    viewports: [375, 1280],
    containers: (el) => [["card", el.parentElement.parentElement], ["name column", el.parentElement.parentElement.children[1]], ["answer", el.parentElement.parentElement.parentElement]],
    setup: async (page) => {
      const toggles = page.locator("#hulp button[aria-expanded]");
      await toggles.first().waitFor({ timeout: 20000 });
      const n = await toggles.count();
      let best = -1, bestCount = 0;
      for (let i = 0; i < Math.min(n, 18); i++) {
        await toggles.nth(i).click(); await page.waitForTimeout(120);
        const c = await page.locator('#hulp a[aria-label^="E-mail"], #hulp a[aria-label^="Bel "]').count();
        if (c > bestCount) { best = i; bestCount = c; }
        await toggles.nth(i).click(); await page.waitForTimeout(80);
        if (bestCount >= 2) break;
      }
      await toggles.nth(best).click(); await page.waitForTimeout(250);
      await page.locator('#hulp a[aria-label^="E-mail"], #hulp a[aria-label^="Bel "]').first().scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, -160)); await page.waitForTimeout(400);
    },
    options: [
      { key: "today", name: "Today", css: "", note: "40 × 40 bordered box, 16px icon.", visual: false },
      { key: "A", name: "A · Invisible hit area", visual: false, vr: "0 stories move",
        css: (s) => hit44(s), note: "Same 40px box on screen. A pseudo-element adds 2px of invisible hit area on each side, inside the card's own 12px padding and the 6px gap between the two actions." },
      { key: "B", name: "B · Visible 44px box", visual: true, vr: "ContactCard, QuestionCard, HulpFinder stories",
        css: (s) => `${s}{width:44px;height:44px}`, note: "The box grows to 44px like the monogram next to it. Card height stays (monogram is already 44). The name column loses 4px per action." },
      { key: "C", name: "C · Labelled buttons", visual: true, vr: "ContactCard, QuestionCard, HulpFinder stories",
        css: (s) => `${s}{width:auto;height:44px;padding:0 10px;gap:6px;font:600 10px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.05em;text-transform:uppercase}\n#hulp a[aria-label^="E-mail"]::after{content:"Mail"}\n#hulp a[aria-label^="Bel "]::after{content:"Bel"}`,
        note: "Icon + word, 44px tall. Meets the 'a control that stands alone shows a word' line too. Costs width: on a phone the name wraps sooner." },
    ],
  },
  {
    id: "2-explorer", title: "2 · Organigram explorer — Vorige / Volgende functie", page: "/hulp",
    where: "Dark fullscreen verkenner on /hulp. Phones: yes.",
    sel: 'button[aria-label="Vorige functie"], button[aria-label="Volgende functie"]',
    viewports: [375, 1280],
    containers: (el) => [["siblings row", el.parentElement], ["spotlight", el.closest(".spotlight-pop") || el.parentElement.parentElement]],
    setup: async (page) => {
      await page.locator("#hulp button[aria-expanded]").first().waitFor({ timeout: 20000 });
      const expand = page.getByRole("button", { name: "Bekijk het volledige organigram" });
      if (await expand.count()) { await expand.click(); await page.waitForTimeout(400); }
      await page.getByRole("button", { name: /Blader door het organigram/ }).first().click();
      await page.getByRole("button", { name: "Vorige functie" }).waitFor({ timeout: 10000 });
      await page.waitForTimeout(600);
    },
    options: [
      { key: "today", name: "Today", css: "", note: "28 × 28: 14px caret + 6px padding + 1px border.", visual: false },
      { key: "A", name: "A · Invisible hit area", visual: false, vr: "0 stories move",
        css: (s) => hit44(s), note: "Same 28px box. 8px of invisible hit area each side lands in the row's own 12px gaps; the row is over 100px tall so nothing above or below is touched." },
      { key: "B", name: "B · Visible 44px box, same caret", visual: true, vr: "OrganigramExplorer stories",
        css: (s) => `${s}{width:44px;height:44px;padding:0;display:flex;align-items:center;justify-content:center}`, note: "Box grows to 44px, caret stays 14px — reads as an empty frame." },
      { key: "C", name: "C · Visible 44px box, 20px caret", visual: true, vr: "OrganigramExplorer stories",
        css: (s) => each(s, (x) => `${x}{width:44px;height:44px;padding:0;display:flex;align-items:center;justify-content:center}\n${x} svg{width:20px;height:20px}`), note: "Box 44px and a bigger caret to fill it. The siblings row gets 32px wider." },
    ],
  },
  {
    id: "3-search-hero", title: "3 · Search 'Wissen' (X) — hero box", page: "/hulp",
    where: "The big search under the hero title on /hulp. Phones: yes.",
    sel: '#hub-hero button[aria-label="Wissen"]',
    viewports: [375, 1280],
    containers: (el) => [["search box", el.parentElement], ["hero", document.getElementById("hub-hero")]],
    setup: async (page) => {
      const box = page.locator('#hub-hero [role="combobox"]').first();
      await box.waitFor({ timeout: 20000 }); await box.fill("trainer"); await page.waitForTimeout(300);
      await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    },
    options: [
      { key: "today", name: "Today", css: "", note: "32 × 32 (20px X + 6px pull-back padding, already the negative-margin idiom).", visual: false },
      { key: "A", name: "A · Invisible hit area", visual: false, vr: "0 stories move",
        css: (s) => hit44(s), note: "Same X. 44px hit area. Watch the red marks: the left edge lands on the text field itself — the rule forbids that." },
      { key: "B", name: "B · Invisible hit area + field gives 4px back", visual: false, vr: "0 stories move (text end moves 6px)",
        css: (s) => `${hit44(s)}\n#hub-hero input[role="combobox"]{margin-inline-end:4px}`, note: "Same as A, but the text field's box ends 4px earlier, so the hit area only lands in the row's own gap. Nothing moves that you can see; a full field ends 4px sooner." },
      { key: "C", name: "C · Visible 44px button", visual: true, vr: "HubSearch stories",
        css: (s) => `${s}{margin:0;padding:0;width:44px;height:44px;display:flex;align-items:center;justify-content:center}`, note: "A real 44px box in the row. The field gets 24px narrower; box height already fits 44." },
    ],
  },
  {
    id: "3b-search-nav", title: "3b · Search 'Wissen' (X) — sticky bar", page: "/hulp",
    where: "The compact search in the sticky section bar, once the hero scrolls away. Phones: yes.",
    sel: 'nav[aria-label="Secties van de hub"] button[aria-label="Wissen"]',
    viewports: [375, 1280],
    containers: (el) => [["search box", el.parentElement], ["sticky bar", el.closest("nav")]],
    setup: async (page) => {
      await page.locator("#hulp button[aria-expanded]").first().waitFor({ timeout: 20000 });
      await page.evaluate(() => document.getElementById("structuur").scrollIntoView({ block: "start" }));
      await page.waitForTimeout(900);
      const box = page.locator('nav[aria-label="Secties van de hub"] [role="combobox"]').first();
      await box.waitFor({ timeout: 10000 }); await box.fill("trainer"); await page.waitForTimeout(300);
      await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    },
    options: [
      { key: "today", name: "Today", css: "", note: "Small X in a 4px-padded box inside a 52px bar.", visual: false },
      { key: "A", name: "A · Invisible hit area", visual: false, vr: "0 stories move",
        css: (s) => hit44(s), note: "44px hit area around the X. It overruns the box border top and bottom into the bar's own 8px padding, and its left edge lands on the field." },
      { key: "B", name: "B · Invisible hit area + field gives 6px back", visual: false, vr: "0 stories move",
        css: (s) => `${hit44(s)}\nnav[aria-label="Secties van de hub"] input[role="combobox"]{margin-inline-end:6px}`, note: "As A, but the field's box ends 6px earlier so the hit area stays off it. The 6px overrun above and below the small box lands in the bar's own 8px padding." },
      { key: "C", name: "C · Visible 44px button", visual: true, vr: "HubSearch, OrganigramSectionNav stories",
        css: (s) => `${s}{margin:0;padding:0;width:44px;height:44px;display:flex;align-items:center;justify-content:center}`, note: "A 44px box inside a slot built for ~28px: the box, and with it the sticky bar, grows. Every anchor offset on the page follows the bar's height." },
    ],
  },
  {
    id: "4-matchstrip", title: "4 · Match strip — result / fixture arrows", page: "/",
    where: "Top of every page, desktop only (lg and up).",
    sel: 'button[aria-label="Toon de laatste uitslag"], button[aria-label="Toon de volgende wedstrijd"]',
    viewports: [1280],
    containers: (el) => [["cell", el.parentElement], ["strip", el.parentElement.parentElement]],
    setup: async (page) => { await page.getByRole("button", { name: "Toon de laatste uitslag" }).waitFor({ timeout: 20000 }); },
    options: [
      { key: "today", name: "Today", css: "", note: "36 × 36 bordered box with a text arrow.", visual: false },
      { key: "A", name: "A · Invisible hit area", visual: false, vr: "0 stories move",
        css: (s) => hit44(s), note: "Same 36px box, 4px of invisible hit area each side — inside the cell's 20px side padding and 8px gap." },
      { key: "B", name: "B · Visible 44px box", visual: true, vr: "MatchStripView, MatchStripInContext stories",
        css: (s) => `${s}{width:44px;height:44px}`, note: "Boxes grow 8px. If the strip is shorter than 44px it grows too — see the context shot." },
    ],
  },
  {
    id: "5-calendar", title: "5 · Calendar — Vorige / Volgende maand (week)", page: "/kalender",
    where: "Toolbar on /kalender. Phones already get 44 × 44; from md up it is 32 × 32.",
    sel: 'button[aria-label="Vorige maand"], button[aria-label="Volgende maand"], button[aria-label="Vorige week"], button[aria-label="Volgende week"]',
    viewports: [375, 1280], todayOnlyAt: [375],
    containers: (el) => [["period nav", el.parentElement], ["toolbar", el.parentElement.parentElement]],
    setup: async (page) => { await page.getByRole("button", { name: /^Vorige (maand|week)/ }).waitFor({ timeout: 20000 }); },
    options: [
      { key: "today", name: "Today", css: "", note: "44 on phones, 32 × 32 from md.", visual: false },
      { key: "A", name: "A · Invisible hit area (md+)", visual: false, vr: "0 stories move",
        css: (s) => hit44(s), note: "Same 32px box on desktop, 6px invisible hit area each side — 8px gaps around it. Check whether it pokes above or below the toolbar row." },
      { key: "B", name: "B · Visible 44px box everywhere", visual: true, vr: "CalendarWidget stories",
        css: (s) => `${s}{width:44px;height:44px}`, note: "Drop the desktop shrink: 44 at every width, like the phone already has. The toolbar row grows if it is shorter than 44." },
    ],
  },
];

// ---- in-page measurement + overlay -----------------------------------------------------------
const MEASURE = `(el) => {
  const desc = (e) => e.tagName.toLowerCase() + (e.getAttribute("aria-label") ? '[' + e.getAttribute("aria-label").slice(0, 28) + ']' : (e.textContent || '').trim() ? ' "' + e.textContent.trim().slice(0, 18) + '"' : '');
  const INTER = 'a[href],button,input,select,textarea,[role="button"],[role="combobox"],[role="link"],[role="tab"],[role="menuitem"]';
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const hits = (x, y) => { const e = document.elementFromPoint(x, y); return !!e && (e === el || el.contains(e)); };
  let l = cx, rt = cx, t = cy, b = cy;
  for (let x = cx; x > cx - 60; x -= 1) { if (hits(x, cy)) l = x; else break; }
  for (let x = cx; x < cx + 60; x += 1) { if (hits(x, cy)) rt = x; else break; }
  for (let y = cy; y > cy - 60; y -= 1) { if (hits(cx, y)) t = y; else break; }
  for (let y = cy; y < cy + 60; y += 1) { if (hits(cx, y)) b = y; else break; }
  const hit = { l, t, w: Math.round(rt - l + 1), h: Math.round(b - t + 1) };
  const hitR = { l, t, r: rt + 1, b: b + 1 };
  // geometric overlap of the hit area with other interactive elements (a pseudo-element hides them from elementFromPoint)
  const overlaps = [];
  for (const e of document.querySelectorAll(INTER)) {
    if (e === el || el.contains(e) || e.contains(el)) continue;
    const q = e.getBoundingClientRect(); if (!q.width || !q.height) continue;
    const ow = Math.min(hitR.r, q.right) - Math.max(hitR.l, q.left), oh = Math.min(hitR.b, q.bottom) - Math.max(hitR.t, q.top);
    if (ow > 0.5 && oh > 0.5) {
      const ol = Math.max(hitR.l, q.left), ot = Math.max(hitR.t, q.top);
      const prev = el.style.pointerEvents; el.style.pointerEvents = "none";
      const under = document.elementFromPoint(ol + ow / 2, ot + oh / 2);
      el.style.pointerEvents = prev;
      if (under && (under === e || e.contains(under))) overlaps.push({ who: desc(e), w: Math.round(ow), h: Math.round(oh), l: ol, t: ot });
    }
  }
  overlaps.sort((a, b2) => b2.w * b2.h - a.w * a.h);
  // spill: how far the hit area pokes outside the control's own box (parent) on each side
  const pb = el.parentElement.getBoundingClientRect();
  const sp = (bb) => ({ top: Math.max(0, Math.round(bb.top - hitR.t)), bottom: Math.max(0, Math.round(hitR.b - bb.bottom)), left: Math.max(0, Math.round(bb.left - hitR.l)), right: Math.max(0, Math.round(hitR.r - bb.right)) });
  const spill = sp(pb);
  const outerEl = el.closest('nav, [role="dialog"], #hub-hero, section, header, [class*="lg:grid"], [data-testid], form') || el.parentElement.parentElement;
  const spill2 = sp(outerEl.getBoundingClientRect());
  const sq = { l: cx - 22, t: cy - 22, r: cx + 22, b: cy + 22 };
  let covered = 0, total = 0;
  for (let x = sq.l + 1.5; x < sq.r; x += 3) for (let y = sq.t + 1.5; y < sq.b; y += 3) { total++; if (hits(x, y)) covered++; }
  return { visual: { w: Math.round(r.width), h: Math.round(r.height) }, hit, coverage: Math.round(100 * covered / total),
           overlaps: overlaps.slice(0, 3), spill, spill2, centre: [cx, cy], rect: { l: r.left, t: r.top, w: r.width, h: r.height } };
}`;

const OVERLAY = `(el, m) => {
  document.getElementById("__proto_overlay")?.remove();
  const o = document.createElement("div"); o.id = "__proto_overlay";
  o.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647";
  const box = (l, t, w, h, css) => { const d = document.createElement("div"); d.style.cssText = "position:absolute;left:" + l + "px;top:" + t + "px;width:" + w + "px;height:" + h + "px;box-sizing:border-box;" + css; o.appendChild(d); };
  box(m.hit.l, m.hit.t, m.hit.w, m.hit.h, "background:rgba(0,128,60,.28)");
  box(m.centre[0] - 22, m.centre[1] - 22, 44, 44, "border:1.5px dashed #0a0a0a;outline:1px solid rgba(255,255,255,.6)");
  for (const o of m.overlaps) box(o.l, o.t, o.w, o.h, "background:rgba(214,40,40,.55);outline:1px solid #d62828");
  document.body.appendChild(o);
}`;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function clipAround(rect, vw, vh, padX, padY) {
  const l = clamp(rect.l - padX, 0, vw), t = clamp(rect.t - padY, 0, vh);
  const r = clamp(rect.l + rect.w + padX, 0, vw), b = clamp(rect.t + rect.h + padY, 0, vh);
  return { x: l, y: t, width: Math.max(1, r - l), height: Math.max(1, b - t) };
}

const data = { generated: new Date().toISOString(), base: BASE, controls: [] };
const browser = await chromium.launch();
for (const c of CONTROLS) {
  const entry = { id: c.id, title: c.title, where: c.where, options: c.options.map(({ css, ...o }) => o), shots: {} };
  for (const vw of c.viewports) {
    const vh = vw < 600 ? 800 : 900;
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE + c.page, { waitUntil: "load" });
    await c.setup(page);
    await page.addStyleTag({ content: "/* proto */" }).then((h) => h.evaluate((el) => (el.id = "__proto_css")));
    const opts = (c.todayOnlyAt || []).includes(vw) ? c.options.filter((o) => o.key === "today") : c.options;
    let today = null;
    for (const o of opts) {
      const css = typeof o.css === "function" ? o.css(c.sel) : o.css;
      await page.evaluate((s) => { document.getElementById("__proto_css").textContent = s; }, css);
      await page.waitForTimeout(250);
      const first = page.locator(c.sel).first();
      await first.evaluate((el) => el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" }));
      await page.waitForTimeout(350);
      const m = await first.evaluate(new Function("return " + MEASURE)());
      const conts = await first.evaluate(new Function("return (el, mk) => { const f = (" + c.containers.toString() + "); return f(el).map(([n, e]) => { const r = e.getBoundingClientRect(); return { name: n, w: Math.round(r.width), h: Math.round(r.height), l: r.left, t: r.top }; }); }")());
      if (o.key === "today") today = conts;
      const deltas = conts.map((k, i) => ({ name: k.name, w: k.w, h: k.h, dw: today ? k.w - today[i].w : 0, dh: today ? k.h - today[i].h : 0 }));
      await first.evaluate(new Function("return " + OVERLAY)(), m);
      const closeClip = clipAround(m.rect, vw, vh, 120, 72);
      const big = conts[conts.length - 1];
      const ctxClip = clipAround({ l: big.l, t: big.t, w: big.w, h: big.h }, vw, vh, 12, 12);
      const base = `${c.id}-${vw}-${o.key}`;
      await page.screenshot({ path: join(OUT, base + "-close.png"), clip: closeClip });
      await page.screenshot({ path: join(OUT, base + "-context.png"), clip: ctxClip });
      await page.evaluate(() => document.getElementById("__proto_overlay")?.remove());
      entry.shots[`${vw}-${o.key}`] = { visual: m.visual, hit: { w: m.hit.w, h: m.hit.h }, coverage: m.coverage, overlaps: m.overlaps.map(({ who, w, h }) => ({ who, w, h })), spill: m.spill, spill2: m.spill2, containers: deltas };
      console.log(`${base}: visual ${m.visual.w}×${m.visual.h} hit ${m.hit.w}×${m.hit.h} cover ${m.coverage}% overlaps ${JSON.stringify(m.overlaps.map(({ who, w, h }) => `${who} ${w}×${h}`))} spill ${JSON.stringify(m.spill)} outer ${JSON.stringify(m.spill2)} Δ ${deltas.map((d) => `${d.name} ${d.dw >= 0 ? "+" : ""}${d.dw}w ${d.dh >= 0 ? "+" : ""}${d.dh}h`).join(", ")}`);
    }
    await ctx.close();
  }
  data.controls.push(entry);
}
await browser.close();
writeFileSync(join(HERE, "data.json"), JSON.stringify(data, null, 2));
console.log("wrote data.json +", Object.values(data.controls).reduce((n, c) => n + Object.keys(c.shots).length * 2, 0), "shots");

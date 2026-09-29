// Throwaway prototype: iOS focus-zoom fix options for the 3 form fields under 16px.
// Injects each option as CSS on production, measures, crops screenshots.
// Run: node docs/design/mockups/ios-input-zoom/_shoot.mjs   (writes shots/ + data.json)
import { chromium } from "/Users/kevinvanransbeeck/Sites/KCVV/www.kcvvelewijt.be/apps/web/node_modules/@playwright/test/index.mjs";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
const HERE = new URL("./", import.meta.url).pathname;
const BASE = "https://kcvv-nextjs.vercel.app";
const CONTROLS = [
  { id: "hero", path: "/hulp", sel: 'input[class*="text-[15px]"]', desk: 16 },
  { id: "nav", path: "/hulp", sel: 'input[class*="text-[13px]"]', desk: 14, scroll: 1400 },
  { id: "select", path: "/kalender", sel: 'select[aria-label="Team toevoegen"]', desk: 12, open: "Abonneer", remove: "U21" },
];
const css = (sel, v) => `${sel}{font-size:${v}px!important}`;
const b = await chromium.launch();
const data = existsSync(HERE + "data.json") ? JSON.parse(readFileSync(HERE + "data.json", "utf8")) : {};
const ONLY = process.argv[2];
for (const c of CONTROLS.filter((x) => !ONLY || x.id === ONLY)) for (const w of [375, 768, 1280]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
  await p.goto(BASE + c.path, { waitUntil: "networkidle" });
  if (c.open) { await p.getByRole("button", { name: new RegExp(c.open) }).first().click(); await p.waitForTimeout(600); if (c.remove) { await p.getByRole("button", { name: new RegExp(c.remove) }).first().click(); await p.waitForTimeout(400); } }
  if (c.scroll) { await p.mouse.wheel(0, c.scroll); await p.waitForTimeout(800); }
  const opts = { now: "", A: w >= 1024 ? css(c.sel, c.desk) : css(c.sel, 16), B: css(c.sel, 16) };
  for (const [k, style] of Object.entries(opts)) {
    if (w < 1024 && k === "B") continue; // A == B below lg
    await p.evaluate((s) => { let e = document.getElementById("__p"); if (!e) { e = document.createElement("style"); e.id = "__p"; document.head.append(e); } e.textContent = s; }, style);
    const el = p.locator(c.sel).filter({ visible: true }).first();
    if (!(await el.count())) { (data[c.id] ??= {})[`${w}-${k}`] = { missing: true }; continue; }
    if (!c.scroll) await el.scrollIntoViewIfNeeded();
    await p.waitForTimeout(200);
    const m = await el.evaluate((e) => {
      const barH = (() => { let n = e, h = []; for (let i = 0; i < 5 && n; i++) { h.push(Math.round(n.getBoundingClientRect().height)); n = n.parentElement; } return h[4]; })();
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      const ctx = document.createElement("canvas").getContext("2d"); ctx.font = cs.font;
      const text = e.placeholder || e.options?.[e.selectedIndex]?.text || "";
      const room = e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      let bar = e.parentElement; while (bar && bar.scrollWidth <= bar.clientWidth && bar.parentElement && bar.getBoundingClientRect().height < 120) bar = bar.parentElement;
      const row = e.closest("nav,form,section,header,div");
      return { font: cs.fontSize, text, w: Math.round(r.width), h: Math.round(r.height), textW: Math.round(ctx.measureText(text).width), room: Math.round(room),
        overflow: document.documentElement.scrollWidth > innerWidth, barH, y: r.y, bottom: r.bottom };
    });
    (data[c.id] ??= {})[`${w}-${k}`] = m;
    const top = Math.max(0, m.y - 90);
    await p.screenshot({ path: `${HERE}shots/${c.id}-${w}-${k}.png`, clip: { x: 0, y: top, width: w, height: Math.min(220, 900 - top) } });
  }
  await p.close();
}
writeFileSync(HERE + "data.json", JSON.stringify(data, null, 1));
console.log(JSON.stringify(data, null, 1));
await b.close();

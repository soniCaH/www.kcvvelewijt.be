import { chromium } from "/Users/kevinvanransbeeck/Sites/KCVV/www.kcvvelewijt.be/apps/web/node_modules/@playwright/test/index.mjs";
import { writeFileSync } from "node:fs";
const B = "https://kcvv-nextjs.vercel.app";
const OUT = new URL("./shots/", import.meta.url).pathname;
const snug = (v) => `.text-label.leading-snug{line-height:${v}!important}`;
const wrapOpts = { "1": snug(1), "1.2": snug(1.2), "1.3": snug(1.3), "1.375": "" };
const cases = [
  { id: "ticketstub", path: "/evenementen", w: 375, sel: ".text-label.leading-snug", pick: (t) => t.startsWith("26"), opts: wrapOpts, card: "ancestor::a[1]" },
  { id: "eventhero", path: "/evenementen/ek-darts", w: 375, sel: ".text-label.leading-snug", pick: (t) => t.startsWith("KANTINE"), opts: wrapOpts, card: "ancestor::header[1] | ancestor::section[1]" },
  { id: "home-link", path: "/", w: 375, sel: ".text-label", pick: (t) => t.startsWith("ALLE SPONSORS"), opts: { "1": "", "1.3": ".text-label{line-height:1.3!important}" } },
  { id: "home-pill", path: "/", w: 375, sel: ".text-label", pick: (t) => t === "Uit" || t === "UIT", opts: { "1": "", "1.3": ".text-label{line-height:1.3!important}" } },
  { id: "matchstrip", path: "/", w: 375, sel: ".text-mono-md.leading-none,.text-mono-sm.leading-none", pick: () => true, opts: { "1": "", "1.4": ".text-mono-md.leading-none,.text-mono-sm.leading-none{line-height:1.4!important}" }, card: "ancestor::*[contains(@class,'border-b') or self::section][1]" },
  { id: "matchstrip", path: "/", w: 1280, sel: ".text-mono-md.leading-none,.text-mono-sm.leading-none", pick: () => true, opts: { "1": "", "1.4": ".text-mono-md.leading-none,.text-mono-sm.leading-none{line-height:1.4!important}" }, card: "ancestor::*[contains(@class,'border-b') or self::section][1]" },
];
const b = await chromium.launch();
const data = [];
for (const c of cases) {
  const p = await b.newPage({ viewport: { width: c.w, height: 900 }, deviceScaleFactor: 2 });
  await p.goto(B + c.path, { waitUntil: "networkidle" });
  const els = p.locator(c.sel);
  let el;
  for (let i = 0; i < (await els.count()); i++) if ((await els.nth(i).isVisible()) && c.pick((await els.nth(i).innerText()).trim())) { el = els.nth(i); break; }
  if (!el) { console.log("MISS", c.id); continue; }
  await el.scrollIntoViewIfNeeded();
  const row = { id: `${c.id}-${c.w}`, path: c.path, w: c.w, text: (await el.innerText()).trim().slice(0, 60), opts: {} };
  for (const [k, css] of Object.entries(c.opts)) {
    await p.evaluate((css) => { let s = document.getElementById("__proto_css"); if (!s) { s = document.createElement("style"); s.id = "__proto_css"; document.head.append(s); } s.textContent = css; }, css);
    await p.waitForTimeout(150);
    const bb = await el.boundingBox();
    const card = c.card ? el.locator(`xpath=${c.card}`).first() : null;
    const cb = card && (await card.count()) ? await card.boundingBox() : null;
    row.opts[k] = { h: Math.round(bb.height), card: cb && Math.round(cb.height) };
    const top = Math.max(0, (cb ?? bb).y - 24), bot = (cb ? cb.y + cb.height : bb.y + bb.height) + 24;
    const clip = { x: 0, y: top, width: c.w, height: Math.min(bot - top, 520) };
    await p.screenshot({ path: `${OUT}${row.id}-${k}.png`, clip });
  }
  data.push(row);
  await p.close();
}
writeFileSync(new URL("./data.json", import.meta.url), JSON.stringify(data, null, 1));
console.log(JSON.stringify(data, null, 1));
await b.close();

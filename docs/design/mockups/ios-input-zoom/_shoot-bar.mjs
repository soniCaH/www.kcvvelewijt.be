// Sticky /hulp bar: can the search field go to 16px without out-growing the chips?
// Run: node docs/design/mockups/ios-input-zoom/_shoot-bar.mjs   (writes shots/bar-* + bar.json)
import { chromium } from "/Users/kevinvanransbeeck/Sites/KCVV/www.kcvvelewijt.be/apps/web/node_modules/@playwright/test/index.mjs";
import { writeFileSync } from "node:fs";
const HERE = new URL("./", import.meta.url).pathname;
const IN = 'input[class*="text-[13px]"]';
const OPTS = {
  now: "",
  plain16: `${IN}{font-size:16px!important}`,
  // text-body-md (16px / 1.6) + the slot's padding py-1 -> py-0.5
  fit: `${IN}{font-size:16px!important;line-height:1.6!important} div:has(> ${IN}){padding-top:2px!important;padding-bottom:2px!important}`,
  // same, but the slot stretches to the row's tallest item (the chip): equal by construction
  stretch: `${IN}{font-size:16px!important;line-height:1.6!important} div:has(> div > ${IN}){align-self:stretch!important;display:flex!important} div:has(> ${IN}){padding-top:0!important;padding-bottom:0!important;flex:1!important}`,
  // chips grow to meet the 16px field instead
  chips: `${IN}{font-size:16px!important} nav a.border-ink.inline-block{padding-top:8.5px!important;padding-bottom:8.5px!important}`,
};
const b = await chromium.launch(); const out = {};
for (const w of [375, 1280]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
  await p.goto("https://kcvv-nextjs.vercel.app/hulp", { waitUntil: "networkidle" }); await p.mouse.wheel(0, 1400); await p.waitForTimeout(800);
  for (const [k, css] of Object.entries(OPTS)) {
    await p.evaluate((s) => { let e = document.getElementById("__p"); if (!e) { e = document.createElement("style"); e.id = "__p"; document.head.append(e); } e.textContent = s; }, css);
    await p.waitForTimeout(200);
    const m = await p.locator(IN).filter({ visible: true }).first().evaluate((e) => {
      const nav = e.closest("nav"), h = (n) => Math.round(n.getBoundingClientRect().height * 10) / 10;
      const chip = nav.querySelector("a.border-ink.inline-block");
      return { font: getComputedStyle(e).fontSize, box: h(e.parentElement), chip: h(chip), nav: h(nav), y: nav.getBoundingClientRect().y };
    });
    out[`${w}-${k}`] = m;
    await p.screenshot({ path: `${HERE}shots/bar-${w}-${k}.png`, clip: { x: 0, y: Math.max(0, m.y - 8), width: w, height: 72 } });
  }
  await p.close();
}
writeFileSync(HERE + "bar.json", JSON.stringify(out, null, 1)); console.log(out); await b.close();

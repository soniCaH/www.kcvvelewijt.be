import { chromium } from "playwright";
import { pageFns } from "./_lib.mjs";
const BASE = "https://kcvv-nextjs.vercel.app";
const b = await chromium.launch();
for (const w of [1440, 390]) for (const path of ["/ploegen/eerste-elftallen-a", "/club"]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
  await p.addScriptTag({ content: pageFns });
  const r = await p.evaluate(() => {
    const out = __seams().map(({ s, prev, next }) => {
      const pb = __padded(prev, "bottom"), pt = __padded(next, "top");
      const h = (e) => e?.querySelector("h2,h3")?.textContent.trim().slice(0, 30);
      return { kind: "seam", above: h(prev) ?? prev.tagName, below: h(next) ?? next.tagName,
        gap: Math.round(__ink(next, "top") - __ink(prev, "bottom")),
        pb: pb ? getComputedStyle(pb).paddingBottom : "-", pt: pt ? getComputedStyle(pt).paddingTop : "-" };
    });
    document.querySelectorAll("main [class*=bg-cream-deep]").forEach((el) => {
      const prev = el.previousElementSibling; if (!prev || prev.matches("svg")) return;
      out.push({ kind: "bare", below: el.querySelector("h2")?.textContent.trim(), gap: Math.round(__ink(el, "top") - __ink(prev, "bottom")) });
    });
    return out;
  });
  console.log(w, path); console.table(r);
  await p.close();
}
await b.close();

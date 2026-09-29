import { chromium } from "/Users/kevinvanransbeeck/Sites/KCVV/www.kcvvelewijt.be/apps/web/node_modules/@playwright/test/index.mjs";
const B = "https://kcvv-nextjs.vercel.app";
const b = await chromium.launch();
for (const w of [320, 375]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  for (const path of ["/", "/evenementen", "/evenementen/balletjesfestival-2026", "/evenementen/ek-darts", "/evenementen/steakfestijn-2027"]) {
    await p.goto(B + path, { waitUntil: "networkidle" });
    const r = await p.evaluate(() => {
      const snug = [...document.querySelectorAll(".text-label.leading-snug")].map(e => { const lh = parseFloat(getComputedStyle(e).lineHeight); return { t: e.innerText.slice(0, 50).replace(/\n/g," / "), lines: Math.round(e.getBoundingClientRect().height / lh) }; });
      const labels = document.querySelectorAll(".text-label").length;
      const multi = [...document.querySelectorAll(".text-label")].filter(e => { const cs = getComputedStyle(e); return cs.display!=="none" && e.getClientRects().length && e.getBoundingClientRect().height > parseFloat(cs.fontSize) * 1.9 && !e.querySelector("div,p,span span"); }).map(e=>e.innerText.slice(0,40).replace(/\n/g," / "));
      const strip = [...document.querySelectorAll(".text-mono-md.leading-none,.text-mono-sm.leading-none")].length;
      return { snug, labels, multi, strip };
    });
    console.log(w, path, JSON.stringify(r));
  }
  await p.close();
}
await b.close();

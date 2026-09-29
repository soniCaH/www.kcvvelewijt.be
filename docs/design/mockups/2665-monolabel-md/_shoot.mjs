import { chromium } from "playwright";
const OUT = new URL("./shots/", import.meta.url).pathname;
const opts = {
  now: "",
  label11: ".font-mono.uppercase.text-\\[13px\\]{font-size:11px!important;letter-spacing:.08em!important;line-height:1!important}",
  mono14: ".font-mono.uppercase.text-\\[13px\\]{font-size:14px!important;letter-spacing:0!important;line-height:1!important}",
};
const b = await chromium.launch();
const data = {};
for (const w of [375, 1280]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
  await p.goto("https://kcvv-nextjs.vercel.app/", { waitUntil: "networkidle" });
  for (const [k, css] of Object.entries(opts)) {
    await p.evaluate((c) => { let s = document.getElementById("__proto_css"); if (!s) { s = document.createElement("style"); s.id = "__proto_css"; document.head.append(s); } s.textContent = c; }, css);
    const els = p.locator(".font-mono.uppercase.text-\\[13px\\]");
    const n = await els.count();
    for (let i = 0; i < n; i++) {
      const el = els.nth(i);
      await el.scrollIntoViewIfNeeded();
      const card = el.locator("xpath=ancestor::*[self::section or self::article][1]");
      const txt = (await el.innerText()).slice(0, 30);
      const box = await el.boundingBox();
      (data[`${w}-${i}`] ??= { txt })[k] = box && { w: Math.round(box.width), h: Math.round(box.height) };
      const target = (await card.count()) ? card : el;
      const bb = await el.boundingBox();
      await p.screenshot({ path: `${OUT}${w}-${i}-${k || "now13"}.png`, clip: { x: 0, y: Math.max(0, bb.y - 120 + (await p.evaluate(() => scrollY))), width: w, height: 300 }, fullPage: true });
    }
  }
  await p.close();
}
console.log(JSON.stringify(data, null, 1));
await b.close();

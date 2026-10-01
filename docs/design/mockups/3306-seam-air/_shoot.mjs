// #3306 — three paddings around a <StripedSeam>, injected on production.
// Run from apps/web (resolves playwright): node ../../docs/design/mockups/3306-seam-air/_shoot.mjs
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pageFns } from "./_lib.mjs";

const DIR = dirname(fileURLToPath(import.meta.url));
const BASE = "https://kcvv-nextjs.vercel.app";
// px each side of a section-to-section seam, [<640, >=640]; null = production
const VARIANTS = { a: null, b: [40, 56], c: [24, 32] };
const PAGES = ["/ploegen/eerste-elftallen-a", "/club"];

function apply(px) {
  if (!px) return;
  const v = innerWidth < 640 ? px[0] : px[1];
  for (const { prev, next } of __seams()) {
    const pb = __padded(prev, "bottom"), pt = __padded(next, "top");
    // only section-to-section seams; an opening (hero, sticky nav) keeps its own air
    if (!pb || !pt || parseFloat(getComputedStyle(pb).paddingBottom) < 48) continue;
    pb.style.paddingBottom = v + "px";
    pt.style.paddingTop = v + "px";
  }
}

function measure() {
  const h = (e) => e?.querySelector("h2,h3")?.textContent.trim().replace(/\.$/, "").slice(0, 30) ?? "opening";
  const rows = __seams().map(({ prev, next }) => ({ kind: "seam", above: h(prev), below: h(next), gap: Math.round(__ink(next, "top") - __ink(prev, "bottom")) }));
  document.querySelectorAll("main [class*=bg-cream-deep]").forEach((el) => {
    const prev = el.previousElementSibling;
    if (!prev || prev.matches("svg, nav") || el.matches("nav")) return;
    rows.push({ kind: "bare", above: h(prev), below: h(el), gap: Math.round(__ink(el, "top") - __ink(prev, "bottom")) });
  });
  return { rows, height: document.documentElement.scrollHeight };
}

const data = {};
const browser = await chromium.launch();
for (const w of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
  for (const path of PAGES) {
    for (const [id, px] of Object.entries(VARIANTS)) {
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60_000 });
      await page.addStyleTag({ content: "*{transition:none!important;animation:none!important} header[class*=sticky],nav[class*=sticky]{position:static!important}" });
      await page.addScriptTag({ content: pageFns });
      await page.evaluate(apply, px);
      await page.waitForTimeout(500);
      const m = await page.evaluate(measure);
      (data[path] ??= {})[`${id}-${w}`] = m;
      const slug = path.split("/").pop();
      // team page: Staf -> seam -> Trainingen -> bare -> sponsors; club: whole page
      let clip;
      if (slug === "eerste-elftallen-a") {
        clip = await page.evaluate(() => {
          const seams = __seams(); const last = seams[seams.length - 1];
          const top = last.s.getBoundingClientRect().top + scrollY - 260;
          const sp = [...document.querySelectorAll("main h2")].find((x) => /sponsors/i.test(x.textContent));
          const bottom = sp.getBoundingClientRect().bottom + scrollY + 120;
          return { x: 0, y: top, width: innerWidth, height: bottom - top };
        });
        await page.screenshot({ path: join(DIR, "shots", `team-${w}-${id}.png`), clip, fullPage: true });
      } else {
        await page.screenshot({ path: join(DIR, "shots", `club-${w}-${id}.png`), fullPage: true });
      }
      console.log(path, id, w, m.height, m.rows.map((r) => `${r.kind}:${r.gap}`).join(" "));
    }
  }
  await page.close();
}
await browser.close();
writeFileSync(join(DIR, "data.json"), JSON.stringify(data, null, 1));

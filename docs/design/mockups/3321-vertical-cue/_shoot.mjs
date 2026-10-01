// Prototype for #3321: does a vertically overflowing explorer stage need a cue?
// Opens the organigram explorer on production, injects each option into the
// stage's ScrollOverlay wrapper, and screenshots it. Run from apps/web:
//   node ../../docs/design/mockups/3321-vertical-cue/_shoot.mjs
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(`${process.cwd()}/`)("@playwright/test");
const here = dirname(fileURLToPath(import.meta.url));
const SCENARIOS = [
  { id: "375-a", w: 375, h: 667, step: "A", siblings: false, note: "iPhone SE, default zoom" },
  { id: "360-a", w: 360, h: 640, step: "A", siblings: false, note: "small Android, default zoom" },
  { id: "844-a", w: 844, h: 390, step: "A", siblings: false, note: "phone landscape, default zoom" },
  { id: "375-max", w: 375, h: 667, step: "A++", siblings: true, note: "iPhone SE, largest zoom, fan expanded" },
];
const OPTIONS = ["none", "fade", "arrow"];

const inject = (option) => {
  document.getElementById("__proto")?.remove();
  const d = document.querySelector('[data-testid="organigram-explorer"]');
  const track = [...d.querySelectorAll("*")]
    .filter((e) => ["auto", "scroll"].includes(getComputedStyle(e).overflowY))
    .sort((a, b) => b.clientHeight - a.clientHeight)[0];
  track.scrollTop = 0;
  const remaining = track.scrollHeight - track.clientHeight;
  if (option === "none" || remaining <= 0) return remaining;
  const wrap = track.parentElement;
  const css = getComputedStyle(document.documentElement);
  const ground = getComputedStyle(d).backgroundColor;
  const box = document.createElement("div");
  box.id = "__proto";
  box.innerHTML = `
    <div style="position:absolute;left:0;right:0;bottom:0;height:${Math.min(remaining, 24)}px;
      pointer-events:none;background:linear-gradient(to top, ${ground}, transparent)"></div>
    ${option === "arrow" ? `<button type="button" aria-label="Scroll down" style="position:absolute;left:0;right:0;bottom:8px;margin:0 auto;
      width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;
      background:${css.getPropertyValue("--color-jersey-deep")};color:${css.getPropertyValue("--color-cream")};
      border:2px solid ${css.getPropertyValue("--color-ink")};box-shadow:var(--shadow-paper-sm-soft);
      font-family:var(--font-display);font-style:italic;font-size:16px;line-height:1;z-index:10">↓</button>` : ""}`;
  wrap.appendChild(box);
  return remaining;
};

const b = await chromium.launch();
const data = [];
for (const s of SCENARIOS) {
  const p = await b.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 2 });
  await p.goto("https://kcvv-nextjs.vercel.app/hulp", { waitUntil: "networkidle" });
  const opener = p.getByRole("button", { name: /Blader door het organigram/ }).first();
  if (!(await opener.isVisible())) {
    // The full chart sits behind a disclosure; open it first.
    await p.locator("summary, button[aria-expanded]").filter({ hasText: /organigram/i }).first().click();
  }
  await opener.click();
  const dlg = p.getByTestId("organigram-explorer");
  await dlg.waitFor();
  if (s.siblings) await dlg.getByRole("button", { name: /\+\d|meer|toon/i }).first().click();
  await dlg.getByRole("button", { name: s.step, exact: true }).click();
  await p.waitForTimeout(600);
  for (const o of OPTIONS) {
    const remaining = await p.evaluate(inject, o);
    const file = `shots/${s.id}-${o}.png`;
    await p.screenshot({ path: join(here, file) });
    data.push({ ...s, option: o, remaining, file });
  }
  await p.close();
}
await b.close();
writeFileSync(join(here, "data.json"), JSON.stringify(data, null, 2));
console.table(data.map(({ id, option, remaining }) => ({ id, option, remaining })));

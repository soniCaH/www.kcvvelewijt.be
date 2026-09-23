// #3076 — builds the compare page from data.json + shots/. Run after _shoot.mjs:
//   node docs/design/mockups/3076-tap-targets/_compose.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(HERE, "data.json"), "utf8"));
const pngW = (f) => (existsSync(f) ? readFileSync(f).readUInt32BE(16) : 0);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SUGGEST = {
  "1-contactcard": ["A", "2px of invisible hit area inside the card's own padding. Nothing on screen changes."],
  "2-explorer": ["A", "8px invisible hit area inside the row's 12px gaps. Nothing on screen changes."],
  "3-search-hero": ["B", "A alone lands 4px on the text field. B moves the field's box 4px so the rule holds."],
  "3b-search-nav": ["B", "Same reasoning as the hero box. The 6px overrun above and below stays inside the bar's own padding."],
  "4-matchstrip": ["A", "4px invisible hit area inside the cell's padding and gap. Desktop-only control, mouse users, lowest stakes."],
  "5-calendar": ["B", "The phone already shows 44px boxes; B makes desktop match it. A pokes 6px outside the toolbar row instead."],
};

const spillText = (sp, what) => {
  if (!sp) return "";
  const parts = Object.entries(sp).filter(([, v]) => v > 0).map(([k, v]) => `${v}px ${k}`);
  return parts.length ? `${parts.join(", ")} past the ${what}` : `none past the ${what}`;
};

let sections = "", summaryRows = "";
for (const c of data.controls) {
  const [pick, why] = SUGGEST[c.id] ?? ["", ""];
  const vps = [...new Set(Object.keys(c.shots).map((k) => k.split("-")[0]))].sort((a, b) => a - b);
  const todayCells = vps.map((vw) => { const s = c.shots[`${vw}-today`]; return s ? `${vw}px: <b>${s.visual.w} × ${s.visual.h}</b>` : ""; }).filter(Boolean).join("<br>");
  summaryRows += `<tr><td><a href="#${c.id}">${esc(c.title)}</a></td><td class="num">${todayCells}</td><td>${c.options.filter((o) => o.key !== "today").map((o) => `<span class="chip ${o.key === pick ? "pick" : ""}">${esc(o.key)}</span> ${esc(o.name.replace(/^[A-C] · /, ""))}`).join("<br>")}</td><td><span class="chip pick">${pick}</span> ${esc(why)}</td></tr>`;

  let rows = "";
  for (const vw of vps) {
    let cards = "";
    for (const o of c.options) {
      const key = `${vw}-${o.key}`; const s = c.shots[key]; if (!s) continue;
      const base = `shots/${c.id}-${vw}-${o.key}`;
      const closeW = Math.round(pngW(join(HERE, base + "-close.png")) / 2), ctxW = Math.round(pngW(join(HERE, base + "-context.png")) / 2);
      const meets = s.hit.w >= 44 && s.hit.h >= 44;
      const touches = (s.overlaps || []).length > 0;
      const moved = s.containers.filter((k) => k.dw || k.dh);
      const looks = o.visual || moved.length > 0;
      const verdicts = [
        `<span class="v ${meets ? "ok" : "bad"}">${meets ? "44 × 44 reached" : `only ${s.hit.w} × ${s.hit.h}`}</span>`,
        `<span class="v ${touches ? "bad" : "ok"}">${touches ? "lands on a neighbour" : "touches nothing"}</span>`,
        `<span class="v ${looks ? "warn" : "ok"}">${looks ? "look changes" : "look unchanged"}</span>`,
      ].join(" ");
      const facts = [
        `Visible box ${s.visual.w} × ${s.visual.h}, hit area ${s.hit.w} × ${s.hit.h}, covers ${s.coverage}% of the 44 square.`,
        touches ? `<b class="bad">Overlaps:</b> ${s.overlaps.map((x) => `${esc(x.who)} by ${x.w} × ${x.h}px`).join("; ")}.` : "",
        s.spill ? `Spill: ${spillText(s.spill, "control's own box")}${s.spill2 ? `; ${spillText(s.spill2, "outer container")}` : ""}.` : "",
        moved.length ? `<b>Layout:</b> ${moved.map((k) => `${esc(k.name)} ${k.dw ? (k.dw > 0 ? "+" : "") + k.dw + "px wide" : ""}${k.dw && k.dh ? ", " : ""}${k.dh ? (k.dh > 0 ? "+" : "") + k.dh + "px tall" : ""}`).join("; ")}.` : "Layout: nothing moves.",
        o.vr ? `VR: ${esc(o.vr)}.` : "",
      ].filter(Boolean).map((f) => `<li>${f}</li>`).join("");
      cards += `<article class="opt ${o.key === pick && vps.length ? "suggested" : ""} ${o.key === "today" ? "today" : ""}">
        <header><span class="chip ${o.key === "today" ? "" : o.key === pick ? "pick" : "alt"}">${esc(o.key === "today" ? "now" : o.key)}</span> <h4>${esc(o.name.replace(/^[A-C] · /, ""))}</h4></header>
        <figure><img src="${base}-close.png" width="${closeW}" alt="${esc(o.name)} at ${vw}px, close crop" loading="lazy"></figure>
        <p class="verdicts">${verdicts}</p>
        <p class="note">${esc(o.note)}</p>
        <ul class="facts">${facts}</ul>
        <details><summary>Show in context</summary><img src="${base}-context.png" width="${ctxW}" alt="${esc(o.name)} at ${vw}px, in context" loading="lazy"></details>
      </article>`;
    }
    rows += `<div class="vp"><h3><span class="chip">${vw}px</span> ${vw < 600 ? "phone" : "desktop"}</h3><div class="opts">${cards}</div></div>`;
  }
  sections += `<section id="${c.id}"><h2>${esc(c.title)}</h2><p class="where">${esc(c.where)}</p>${rows}
    <p class="decide"><span class="chip pick">suggested ${esc(pick)}</span> ${esc(why)} <b>Your pick:</b> ${c.options.filter((o) => o.key !== "today").map((o) => o.key).join(" / ")} / leave as is.</p></section>`;
}

const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tap Target Options</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;700&display=swap">
<style>
  :root{color-scheme:light;--bg:#f5f1e6;--paper:#fff9ee;--soft:#ede8da;--ink:#0a0a0a;--muted:#5b574d;--edge:#d9d2bf;--deep:#007c46;--deep-ink:#065f37;--alert:#b84a3a;--warn:#a06a00;--hit:rgba(0,128,60,.28)}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#151512;--paper:#1e1d19;--soft:#26251f;--ink:#f1ede2;--muted:#b3ac9c;--edge:#3a382f;--deep:#3fbf7f;--deep-ink:#8fe0b4;--alert:#e07b6a;--warn:#e0b04a}}
  :root[data-theme="dark"]{color-scheme:dark;--bg:#151512;--paper:#1e1d19;--soft:#26251f;--ink:#f1ede2;--muted:#b3ac9c;--edge:#3a382f;--deep:#3fbf7f;--deep-ink:#8fe0b4;--alert:#e07b6a;--warn:#e0b04a}
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,"Helvetica Neue",Arial,sans-serif}
  main{max-width:1240px;margin:0 auto;padding-block:32px 96px;padding-inline:16px}
  h1{font:700 32px/1.1 Georgia,"Times New Roman",serif;margin:0 0 8px;text-wrap:balance} h2{font:700 24px/1.2 Georgia,serif;margin:0 0 4px}
  h3{font:700 13px/1.2 "IBM Plex Mono",ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em;margin:22px 0 10px;color:var(--muted)}
  h4{font:700 14px/1.3 -apple-system,"Helvetica Neue",Arial,sans-serif;margin:0}
  .lede{max-width:70ch;color:var(--muted);margin:0 0 14px}
  .legend{display:flex;flex-wrap:wrap;gap:14px 22px;margin:0 0 28px;font-size:13px;color:var(--muted)} .legend span::before{content:"";display:inline-block;width:14px;height:14px;vertical-align:-2px;margin-right:6px;border:1px solid var(--edge)}
  .legend .l-hit::before{background:var(--hit)} .legend .l-sq::before{border:1.5px dashed var(--ink)} .legend .l-red::before{background:rgba(214,40,40,.55)}
  table{border-collapse:collapse;width:100%;background:var(--paper);border:2px solid var(--ink);box-shadow:6px 6px 0 var(--ink);margin:0 0 40px;font-size:14px}
  th,td{text-align:left;padding:10px 12px;border-bottom:1px dashed var(--edge);vertical-align:top} th{font:700 11px/1.2 "IBM Plex Mono",ui-monospace,monospace;text-transform:uppercase;letter-spacing:.06em}
  td.num{font-family:"IBM Plex Mono",ui-monospace,monospace;white-space:nowrap} td a{color:inherit}
  .tablewrap{overflow-x:auto}
  section{border:2px solid var(--ink);box-shadow:6px 6px 0 var(--ink);background:var(--paper);padding:20px;margin:0 0 40px}
  .where{margin:0;color:var(--muted)}
  .opts{display:flex;gap:16px;overflow-x:auto;padding-bottom:8px;align-items:stretch}
  .opt{flex:0 0 282px;max-width:100%;border:1.5px solid var(--edge);background:var(--bg);padding:12px;display:flex;flex-direction:column;gap:8px}
  .opt.today{background:var(--soft)} .opt.suggested{border-color:var(--deep);box-shadow:4px 4px 0 var(--deep)}
  .opt header{display:flex;align-items:center;gap:8px}
  figure{margin:0;background:#fff;border:1px solid var(--edge);display:flex;justify-content:center;overflow:hidden} figure img,details img{display:block;max-width:100%;height:auto}
  .chip{display:inline-block;font:700 11px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;padding:5px 7px;border:1.5px solid var(--ink);background:var(--paper);color:var(--ink)}
  .chip.pick{background:var(--deep);border-color:var(--deep);color:#fff} .chip.alt{background:var(--soft)}
  .v{display:inline-block;font:700 11px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.04em;text-transform:uppercase;padding:4px 6px;margin:0 4px 4px 0;border:1px solid currentColor}
  .v.ok{color:var(--deep-ink)} .v.bad{color:var(--alert)} .v.warn{color:var(--warn)} .verdicts{margin:0}
  .note{margin:0;font-size:14px} .facts{margin:0;padding-left:18px;font-size:13px;color:var(--muted)} .facts b{color:var(--ink)} .facts b.bad{color:var(--alert)}
  details{font-size:13px;margin-top:auto} summary{cursor:pointer;color:var(--deep-ink);font-weight:700} details img{margin-top:8px;border:1px solid var(--edge);background:#fff}
  .decide{margin:18px 0 0;padding:12px 14px;border:1.5px dashed var(--ink);background:var(--bg)}
  @media (max-width:700px){.opt{flex-basis:86vw}}
</style>
<main>
  <h1>Five icon-only controls and the 44 × 44 Tap Target Rule</h1>
  <p class="lede">Every screenshot is the <strong>live production page</strong> (${esc(data.base)}) with the option injected as CSS. The hit area is measured with <code>elementFromPoint</code>, not read from the code. Captured ${esc(data.generated.slice(0, 10))} for issue #3076.</p>
  <p class="legend"><span class="l-hit">green = the area your finger can actually hit</span><span class="l-sq">dashed = the 44 × 44 target</span><span class="l-red">red = the hit area on top of another control</span></p>
  <div class="tablewrap"><table><thead><tr><th>Control</th><th>Today</th><th>Options</th><th>Suggested</th></tr></thead><tbody>${summaryRows}</tbody></table></div>
  ${sections}
  <p class="lede">Options marked "look unchanged" move no pixels, so no VR baseline changes. Any option marked "look changes" re-captures the listed stories. Every number here is re-measured by the implementer in the PR, in a real browser, at both widths.</p>
</main>`;
writeFileSync(join(HERE, "3076-tap-targets-compare.html"), html);
console.log("wrote 3076-tap-targets-compare.html", html.length, "bytes;", data.controls.length, "controls");

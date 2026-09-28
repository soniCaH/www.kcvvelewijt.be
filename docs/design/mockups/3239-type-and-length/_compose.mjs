// #3239 — builds the compare page from data.json + shots/. Run after _shoot.mjs:
//   node docs/design/mockups/3239-type-and-length/_compose.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(HERE, "data.json"), "utf8"));
const pngW = (f) => Math.round(readFileSync(join(HERE, "shots", f)).readUInt32BE(16) / 2);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const INTRO = {
  length: "The Laatste nieuws band below 640px. #3234 ruled out a cap or an age floor, so all six articles stay; only their shape changes.",
  stub: "The fixture row in the Eerste ploegen band on its green match-day ground. The same row component (TeamAgendaRow) is used on team pages.",
  kicker: "The label above the event title in the Aanstaand evenement band.",
};
const SUGGEST = {
  length: ["A", "Keeps the photos (faces sell club news) and still saves about 1 400px. B saves 200px more but every row looks the same."],
  stub: ["B", "Both sizes wrap to two lines, so the cost is the same. Legibility is judged by eye; the tie goes to contrast, and cream wins that (4.69 against 3.17)."],
  kicker: ["A", "A colour change only: no new element. B adds a label box that the site uses nowhere else yet."],
};

let sections = "", summary = "";
for (const item of data) {
  const today = item.options.find((o) => o.key === "today");
  const [pick, why] = SUGGEST[item.id];
  let cards = "";
  for (const o of item.options) {
    const facts = [
      `Page height ${o.pageH.toLocaleString("en")}px${o.key === "today" ? "" : ` (${o.pageH - today.pageH > 0 ? "+" : ""}${(o.pageH - today.pageH).toLocaleString("en")}px)`}.`,
      `Band height ${o.secH.toLocaleString("en")}px${o.key === "today" ? "" : ` (${o.secH - today.secH > 0 ? "+" : ""}${o.secH - today.secH}px)`}.`,
      o.ratio ? `Text ${o.fs}, contrast ${o.ratio}:1.` : "",
    ].filter(Boolean).map((f) => `<li>${f}</li>`).join("");
    const label = o.key === "today" ? "now" : o.key;
    cards += `<article class="opt ${o.key === "today" ? "today" : ""} ${o.key === pick ? "suggested" : ""}">
      <header><span class="chip ${o.key === "today" ? "" : o.key === pick ? "pick" : "alt"}">${esc(label)}</span><h3>${esc(o.name.replace(/^[A-C] · /, ""))}</h3></header>
      <figure class="${item.id === "length" ? "tall" : ""}"><img src="shots/${o.file}" width="${pngW(o.file)}" alt="${esc(item.title)}: ${esc(o.name)}, 375px wide" loading="lazy"></figure>
      <p class="note">${esc(o.note)}</p>
      <ul class="facts">${facts}</ul>
    </article>`;
  }
  const opts = item.options.filter((o) => o.key !== "today");
  summary += `<tr><td><a href="#${item.id}">${esc(item.title)}</a></td><td>${opts.map((o) => `<span class="chip ${o.key === pick ? "pick" : "alt"}">${o.key}</span> ${esc(o.name.replace(/^[A-C] · /, ""))}`).join("<br>")}</td><td><span class="chip pick">${pick}</span> ${esc(why)}</td></tr>`;
  sections += `<section id="${item.id}"><h2>${esc(item.title)}</h2><p class="where">${esc(INTRO[item.id])}</p>
    <div class="opts">${cards}</div>
    <p class="decide"><span class="chip pick">suggested ${pick}</span> ${esc(why)} <b>Your pick:</b> ${opts.map((o) => o.key).join(" / ")} / leave as is.</p></section>`;
}

const html = `<title>Homepage Type and Length</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;700&display=swap">
<style>
  :root{color-scheme:light;--bg:#f5f1e6;--paper:#fff9ee;--soft:#ede8da;--ink:#0a0a0a;--muted:#5b574d;--edge:#d9d2bf;--deep:#007c46;--deep-ink:#065f37}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#151512;--paper:#1e1d19;--soft:#26251f;--ink:#f1ede2;--muted:#b3ac9c;--edge:#3a382f;--deep:#3fbf7f;--deep-ink:#8fe0b4}}
  :root[data-theme="dark"]{color-scheme:dark;--bg:#151512;--paper:#1e1d19;--soft:#26251f;--ink:#f1ede2;--muted:#b3ac9c;--edge:#3a382f;--deep:#3fbf7f;--deep-ink:#8fe0b4}
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,"Helvetica Neue",Arial,sans-serif}
  main{max-width:1240px;margin:0 auto;padding-block:32px 96px;padding-inline:16px}
  h1{font:700 32px/1.1 Georgia,"Times New Roman",serif;margin:0 0 8px;text-wrap:balance} h2{font:700 24px/1.2 Georgia,serif;margin:0 0 4px;text-wrap:balance}
  h3{font:700 14px/1.3 -apple-system,"Helvetica Neue",Arial,sans-serif;margin:0}
  .lede{max-width:70ch;color:var(--muted);margin:0 0 24px}
  table{border-collapse:collapse;width:100%;background:var(--paper);border:2px solid var(--ink);box-shadow:6px 6px 0 var(--ink);font-size:14px}
  th,td{text-align:left;padding:10px 12px;border-bottom:1px dashed var(--edge);vertical-align:top} th{font:700 11px/1.2 "IBM Plex Mono",ui-monospace,monospace;text-transform:uppercase;letter-spacing:.06em}
  td a{color:inherit} .tablewrap{overflow-x:auto;margin:0 0 40px}
  section{border:2px solid var(--ink);box-shadow:6px 6px 0 var(--ink);background:var(--paper);padding:20px;margin:0 0 40px}
  .where{margin:0 0 16px;color:var(--muted);max-width:70ch}
  .opts{display:flex;gap:16px;overflow-x:auto;padding-bottom:8px;align-items:flex-start}
  .opt{flex:0 0 360px;max-width:100%;border:1.5px solid var(--edge);background:var(--bg);padding:12px;display:flex;flex-direction:column;gap:8px}
  .opt.today{background:var(--soft)} .opt.suggested{border-color:var(--deep);box-shadow:4px 4px 0 var(--deep)}
  .opt header{display:flex;align-items:center;gap:8px}
  figure{margin:0;border:1px solid var(--edge);background:#fff;overflow:hidden} figure img{display:block;max-width:100%;height:auto}
  figure.tall{max-height:900px;overflow-y:auto}
  .chip{display:inline-block;font:700 11px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;padding:5px 7px;border:1.5px solid var(--ink);background:var(--paper);color:var(--ink)}
  .chip.pick{background:var(--deep);border-color:var(--deep);color:#fff} .chip.alt{background:var(--soft)}
  .note{margin:0;font-size:14px} .facts{margin:0;padding-left:18px;font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
  .decide{margin:18px 0 0;padding:12px 14px;border:1.5px dashed var(--ink);background:var(--bg)}
  @media (max-width:700px){.opt{flex-basis:86vw}}
</style>
<main>
  <h1>Homepage small type and mobile length</h1>
  <p class="lede">Each screenshot is the <strong>live production homepage</strong> (kcvv-nextjs.vercel.app) at 375px wide, with the option injected as CSS. Page and band heights are measured in the browser. Contrast is only a tie-breaker: the club has no WCAG target (#2395). Captured 2026-09-28 for issue #3239.</p>
  <div class="tablewrap"><table><thead><tr><th>Question</th><th>Options</th><th>Suggested</th></tr></thead><tbody>${summary}</tbody></table></div>
  ${sections}
</main>`;
writeFileSync(join(HERE, "3239-type-and-length-compare.html"), html);
console.log("wrote", html.length, "bytes");

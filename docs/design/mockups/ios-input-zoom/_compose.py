# Builds ios-input-zoom-compare.html from data.json + shots/. Run after _shoot.mjs.
import json, html
d = json.load(open("data.json"))
OPT = {"now": ("Now", "now"), "A": ("A · 16px on touch screens", "pick"), "B": ("B · 16px everywhere", "alt")}
C = [
  ("hero", "/hulp — the main search box", "Today 15px. The front door of the help page.",
   {"A": "16px on touch. With a mouse it is 16px too: 15px is off the scale, and a tie rounds up (ticket 6).",
    "B": "16px."},
   ["The field gets 2px taller (26 → 28px).",
    "Phone (375px): the hint text was already cut off (it needs 254px, there is 235px). At 16px it needs 271px, so a few more letters are cut.",
    "768px and wider: the hint text fits in every option."]),
  ("nav", "/hulp — the sticky search in the top bar", "Today 13px. It shows when you scroll past the main box.",
   {"A": "16px on touch, 14px (<code>text-body-sm</code>, the ticket 6 value) with a mouse.",
    "B": "16px."},
   ["On its own, 16px makes the sticky bar 5px taller (51 → 56px) and the box taller than the tabs. The fix is in the sticky bar section at the top.",
    "At 14px (A, mouse) the field gets 2px taller.",
    "“Zoek…” fits in every option. Nothing wraps or overflows."]),
  ("select", "/kalender → Abonneer — “+ voeg toe” dropdown", "Today 11px. It shows after you remove a team from your feed.",
   {"A": "16px on touch, 12px (<code>text-mono-sm</code>) with a mouse.",
    "B": "16px."},
   ["At 16px the dropdown gets 30px wider (110 → 140px) and 3px taller.",
    "At 16px it is clearly bigger than the team chips next to it. See the phone shot.",
    "At 12px (A, mouse) it gets 6px wider. You will hardly see it."]),
]
def fig(cid, w, k):
    m = d[cid][f"{w}-{k}"]; lab, cls = OPT[k]
    note = f'{m["font"]} · field {m["w"]}×{m["h"]}px'
    if w < 1024 and k == "A": lab = "A and B · 16px"
    return f'''<figure class="opt {cls}"><figcaption><span class="chip {cls}">{html.escape(lab)}</span><span class="m">{note}</span></figcaption>
<img src="shots/{cid}-{w}-{k}.png" width="{w}" alt="{html.escape(lab)} at {w}px wide" loading="lazy"></figure>'''
secs = ""
for cid, title, sub, rules, facts in C:
    rows = ""
    for w, name in [(375, "Phone · 375px"), (768, "Tablet · 768px"), (1280, "Desktop · 1280px, mouse")]:
        keys = ["now", "A"] + (["B"] if w >= 1024 else [])
        rows += f'<h4>{name}</h4><div class="row w{w}">' + "".join(fig(cid, w, k) for k in keys) + "</div>"
    secs += f'''<section id="{cid}"><h2>{html.escape(title)}</h2><p class="sub">{html.escape(sub)}</p>
<dl class="rules"><dt><span class="chip pick">A</span></dt><dd>{rules["A"]}</dd><dt><span class="chip alt">B</span></dt><dd>{rules["B"]}</dd></dl>
<ul class="facts">{"".join(f"<li>{html.escape(f)}</li>" for f in facts)}</ul>{rows}</section>'''
page = open("_template.html").read().replace("{{SECTIONS}}", secs)
open("ios-input-zoom-compare.html", "w").write(page)

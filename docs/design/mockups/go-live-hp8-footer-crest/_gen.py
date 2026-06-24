#!/usr/bin/env python3
"""Generate compare.html + the two BOLD crest asset SVGs (with the print offset).

Two options, each a CLEAN, SHARP, FAITHFUL recolor of the real KCVV crest with a
SUBTLE 2-colour print OFFSET (a single flat-colour back copy translated a few viewBox
units down-right). NO halftone, NO grain, NO distress, NO distortion — just a bold,
faithful crest with one tasteful misregister.

  A1  Faithful colours + offset   — closest to the AI look the owner liked. Shield +
      stripes jersey-deep #008755, panels cream, linework ink, ink offset ghost. Dark
      linework needs a light ground → presented on a CREAM panel within the ink footer.
  A2  Retro 2-tone + offset       — jersey-deep + cream + ink, CREAM offset, built to sit
      directly on the INK footer band (cream crest reads on dark).

Geometry is parsed VERBATIM from the source SVG (see _build_crest.py) so every part —
crown, shield outline, all 5 stripes, "55", "KCVV ELEWIJT", football + pentagons — is a
byte-exact copy of the real artwork.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _build_crest import crest_svg  # noqa: E402

CREAM = "#f5f1e6"
INK = "#0a0a0a"
INK_SOFT = "#1f1f1f"
INK_MUTED = "#6b6b6b"
JERSEY = "#008755"
JERSEY_DARK = "#133d28"
WARM = "#f0c264"

# Subtle print offset — a few viewBox units down-right (viewBox is 566.93 wide, so
# ~6 units ≈ 1% — visible-but-subtle at footer scale, sharp edges, no texture).
OFFSET_DX = 6
OFFSET_DY = 6

OUTLINE_NOTE = (
    "<!-- PRODUCTION NOTE: the <text> elements below ('55' + 'KCVV ELEWIJT') are kept "
    "LIVE here only so this asset previews without a private font. Gotham-Medium (the "
    "original) is not a web font; Archivo 800 is substituted at the same x/y/size. For "
    "the SHIPPED asset these two strings MUST be OUTLINED to <path>s exported from the "
    "original .ai file — do not ship live <text> that depends on Gotham/Archivo. The "
    "offset back-layer below is a single flat-colour translated copy of the WHOLE crest "
    "(a clean 2-colour misregister); outline its text too when exporting. -->"
)


# ---- role maps -------------------------------------------------------------------

# A1 — faithful real colours (on-palette green): shield/stripes jersey-deep, panels
# cream, linework/crown/pentagons ink. The "55" prints jersey-deep on its cream panel;
# "KCVV ELEWIJT" prints cream on the jersey band. Offset = flat INK ghost (contrasts the
# colourful crest, reads as a sharp dark misregister behind it).
ROLES_A1 = {
    "body": JERSEY, "stripe": JERSEY, "panel": CREAM,
    "line": INK, "crown": INK, "footballbase": CREAM,
    "pentagon": INK,
}
A1_55 = JERSEY
A1_WORD = CREAM
A1_OFFSET = (INK, OFFSET_DX, OFFSET_DY)

# A2 — retro 2-tone for the dark band: same faithful recolor, but the offset is a flat
# CREAM ghost so the misregister reads as the light plate peeking out on the ink band.
ROLES_A2 = {
    "body": JERSEY, "stripe": JERSEY, "panel": CREAM,
    "line": INK, "crown": INK, "footballbase": CREAM,
    "pentagon": INK,
}
A2_55 = JERSEY
A2_WORD = CREAM
A2_OFFSET = (CREAM, OFFSET_DX, OFFSET_DY)


# =====================================================================
# Standalone transparent asset SVGs (clean real geometry, offset baked in)
# =====================================================================

def _asset(uid, roles, fill55, fillword, offset):
    svg = crest_svg(
        uid, roles, fill55, fillword,
        extra_svg_attrs=' role="img" aria-label="KCVV Elewijt stamnummer 55"',
        offset=offset,
    )
    head, rest = svg.split(">", 1)
    return head + ">\n  " + OUTLINE_NOTE + "\n" + rest


def asset_faithful():
    """A1 — faithful colours + subtle ink offset, transparent ground."""
    return _asset("faithful", ROLES_A1, A1_55, A1_WORD, A1_OFFSET)


def asset_retro():
    """A2 — retro 2-tone + subtle cream offset, transparent ground (for the ink band)."""
    return _asset("retro", ROLES_A2, A2_55, A2_WORD, A2_OFFSET)


# =====================================================================
# compare.html
# =====================================================================

FONT_IMPORT = (
    "@import url('https://fonts.googleapis.com/css2?"
    "family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,900;1,9..144,500&"
    "family=Archivo:wght@400;500;600;700;800&"
    "family=IBM+Plex+Mono:wght@400;500;600&display=swap');"
)


def footer_block(footer_crest, swatch_crest, ground, crest_panel, swatch_ground, swatch_label):
    """A realistic SiteFooter (ink band + cream wordmark + motto + mono colofon) with the
    crest placed BOLD/large near the wordmark, plus a cream/ink swatch.

    footer_crest / swatch_crest: distinct crest SVG strings (distinct uids → no clip-id
    collisions between the two inlined copies).
    crest_panel: "" (crest sits directly on the band) or "cream"/"ink" (crest sits on a
    light/dark panel inset — needed for A1 whose dark linework requires a light ground).
    """
    panel_attr = f' data-crest-panel="{crest_panel}"' if crest_panel else ""
    return f'''
    <div class="footer-demo" data-ground="{ground}">
      <div class="footer-top">
        <div class="footer-crest"{panel_attr}>{footer_crest}</div>
        <h2 class="footer-wordmark"><span class="wm-ink">KCVV </span><span class="wm-jersey">Elewijt</span></h2>
        <p class="footer-motto">Er is maar één <em>plezante</em> compagnie.</p>
      </div>
      <div class="footer-colofon">
        <span>© 1936–2026 KCVV ELEWIJT</span><span class="dot">·</span><span>DRIESSTRAAT 30, 1982 ELEWIJT</span>
        <span class="dot">·</span><span>PRIVACY</span><span class="dot">·</span><span>COOKIEVOORKEUREN</span>
      </div>
    </div>
    <div class="swatch" data-ground="{swatch_ground}">
      <div class="swatch-crest">{swatch_crest}</div>
      <span class="swatch-label">{swatch_label}</span>
    </div>'''


def version_section(badge, title, blurb, direction, body_html):
    return f'''
  <section class="version">
    <div class="harness-head">
      <span class="hh-badge">{badge}</span>
      <h3 class="hh-title">{title}</h3>
      <p class="hh-blurb">{blurb}</p>
    </div>
    <div class="direction-bar">{direction}</div>
    <div class="version-body">{body_html}</div>
  </section>'''


def build_html():
    # --- crest instances (each id suffixed per inlined copy) ---
    c_a1_foot = crest_svg("a1-foot", ROLES_A1, A1_55, A1_WORD, ' class="crest-svg"', A1_OFFSET)
    c_a1_sw = crest_svg("a1-sw", ROLES_A1, A1_55, A1_WORD, ' class="crest-svg"', A1_OFFSET)

    c_a2_foot = crest_svg("a2-foot", ROLES_A2, A2_55, A2_WORD, ' class="crest-svg"', A2_OFFSET)
    c_a2_sw = crest_svg("a2-sw", ROLES_A2, A2_55, A2_WORD, ' class="crest-svg"', A2_OFFSET)

    # A1: ink footer band, crest on an inset CREAM panel + a cream swatch.
    a1_body = f'''
      <div class="grid2">
        {footer_block(c_a1_foot, c_a1_sw, "ink", "cream", "cream", "on cream")}
      </div>'''

    # A2: ink footer band, crest directly on the band + an ink swatch.
    a2_body = f'''
      <div class="grid2">
        {footer_block(c_a2_foot, c_a2_sw, "ink", "", "ink", "on ink")}
      </div>'''

    sections = (
        version_section(
            "A1 · FAITHFUL + OFFSET",
            "Faithful colours + subtle print offset — closest to the AI look",
            "The crest essentially in its real colours: shield + 5 stripes in jersey-deep "
            "#008755 (on-palette but still “the green logo”), the 55 panel / KCVV "
            "ELEWIJT band / football base in cream, linework + crown + pentagons in ink. A "
            "single flat ink copy of the whole crest is offset ~6 units down-right behind it "
            "— a clean 2-colour misregister, sharp edges, no texture. Because the dark "
            "linework needs a light ground, it sits on an inset cream panel within the ink "
            "footer. Rendered BOLD, not a tiny mark.",
            "DIRECTION · faithful real colours · subtle ink offset · on a cream panel",
            a1_body,
        )
        + version_section(
            "A2 · RETRO 2-TONE + OFFSET",
            "Jersey-deep + cream + ink, cream offset — sits on the ink band",
            "The same faithful recolor, but the offset back-copy is flat CREAM so the "
            "misregister reads as the light plate peeking out on the dark band — the "
            "crest sits DIRECTLY on the ink footer with no panel. Jersey-deep shield + "
            "stripes, cream panels + football base + KCVV ELEWIJT, ink linework + crown + "
            "pentagons. Bold, crisp, every part present, one tasteful offset, no texture.",
            "DIRECTION · retro 2-tone · cream offset · directly on the ink band",
            a2_body,
        )
    )

    css = f'''
    {FONT_IMPORT}
    :root{{
      --cream:{CREAM};--ink:{INK};--ink-soft:{INK_SOFT};--ink-muted:{INK_MUTED};
      --jersey-deep:{JERSEY};--jersey-deep-dark:{JERSEY_DARK};--warm:{WARM};
      --font-display:"Fraunces",georgia,serif;
      --font-body:"Archivo",system-ui,sans-serif;
      --font-mono:"IBM Plex Mono",monospace;
    }}
    *{{box-sizing:border-box;}}
    body{{margin:0;background:#2a2a2a;color:var(--ink);font-family:var(--font-body);
      -webkit-font-smoothing:antialiased;}}
    .page-head{{padding:40px 48px 8px;color:var(--cream);font-family:var(--font-mono);}}
    .page-head h1{{font-family:var(--font-display);font-weight:900;font-style:italic;
      font-size:34px;margin:0 0 6px;letter-spacing:-.01em;}}
    .page-head p{{margin:0;font-size:12px;letter-spacing:.04em;color:#bdbdbd;max-width:74ch;line-height:1.6;}}

    .version{{margin:0 0 8px;}}
    .harness-head{{background:var(--ink);color:var(--cream);padding:22px 48px 18px;
      border-top:1px solid #000;}}
    .hh-badge{{display:inline-block;font-family:var(--font-mono);font-weight:600;font-size:11px;
      letter-spacing:.18em;text-transform:uppercase;color:var(--warm);
      border:1px solid var(--warm);padding:3px 9px;}}
    .hh-title{{font-family:var(--font-display);font-weight:900;font-size:24px;margin:12px 0 6px;
      letter-spacing:-.01em;}}
    .hh-blurb{{margin:0;font-size:13px;line-height:1.65;color:#cfcfcf;max-width:84ch;}}
    .direction-bar{{background:var(--warm);color:var(--ink);font-family:var(--font-mono);
      font-weight:600;font-size:11px;letter-spacing:.1em;text-transform:uppercase;
      padding:9px 48px;}}

    .version-body{{padding:28px 48px 40px;display:flex;flex-direction:column;gap:28px;background:#1c1c1c;}}
    .grid2{{display:grid;grid-template-columns:1fr 260px;gap:20px;align-items:stretch;}}

    /* ---- realistic SiteFooter demo ---- */
    .footer-demo{{display:flex;flex-direction:column;}}
    .footer-demo[data-ground="ink"]{{background:var(--ink);color:var(--cream);}}
    .footer-demo[data-ground="cream"]{{background:var(--cream);color:var(--ink);}}
    .footer-top{{text-align:center;padding:52px 24px 40px;display:flex;flex-direction:column;align-items:center;gap:0;}}
    .footer-crest{{margin-bottom:26px;}}
    /* BOLD — large, prominent footer crest (not a tiny 60px mark). */
    .footer-crest .crest-svg{{width:220px;height:220px;display:block;}}
    /* A1: dark linework needs a light ground → inset cream panel. */
    .footer-crest[data-crest-panel="cream"]{{background:var(--cream);padding:26px 30px;
      box-shadow:0 0 0 1px rgba(245,241,230,.12);}}
    .footer-wordmark{{font-family:var(--font-display);font-weight:900;font-style:italic;
      font-size:46px;line-height:1;letter-spacing:-.01em;margin:0;}}
    .footer-demo[data-ground="ink"] .wm-ink{{color:var(--cream);}}
    .footer-demo[data-ground="cream"] .wm-ink{{color:var(--ink);}}
    .wm-jersey{{color:var(--jersey-deep);}}
    .footer-demo[data-ground="ink"] .wm-jersey{{color:#2ec27e;}}
    .footer-motto{{font-family:var(--font-display);font-style:italic;font-weight:500;
      font-size:19px;margin:16px 0 0;}}
    .footer-motto em{{color:var(--jersey-deep);font-style:italic;font-weight:600;}}
    .footer-demo[data-ground="ink"] .footer-motto em{{color:#2ec27e;}}
    .footer-colofon{{background:var(--ink);color:var(--cream);font-family:var(--font-mono);
      font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;
      padding:13px 24px;display:flex;flex-wrap:wrap;justify-content:center;gap:0;align-items:center;}}
    .footer-colofon .dot{{margin:0 8px;color:rgba(245,241,230,.4);}}

    /* ---- cream/ink swatch ---- */
    .swatch{{border:1px solid #3a3a3a;display:flex;flex-direction:column;align-items:center;
      justify-content:center;gap:14px;padding:24px;}}
    .swatch[data-ground="cream"]{{background:var(--cream);}}
    .swatch[data-ground="ink"]{{background:var(--ink);}}
    .swatch-crest .crest-svg{{width:170px;height:170px;display:block;}}
    .swatch-label{{font-family:var(--font-mono);font-size:9.5px;letter-spacing:.12em;
      text-transform:uppercase;}}
    .swatch[data-ground="cream"] .swatch-label{{color:var(--ink-muted);}}
    .swatch[data-ground="ink"] .swatch-label{{color:rgba(245,241,230,.6);}}

    .crest-svg{{overflow:visible;}}
    '''

    html = f'''<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HP-8 · Footer crest — bold, faithful, with print offset</title>
<style>{css}</style>
</head>
<body>
  <div class="page-head">
    <h1>HP-8 · Footer crest — bold &amp; faithful, with a subtle print offset</h1>
    <p>Issue #2236 · go-live-ux-polish. A BOLD, full, faithful recolor of the real KCVV crest
       (<code>kcvv-crest.svg</code>) with the one effect the owner wanted: a SUBTLE 2-colour
       print OFFSET (a single flat-colour back copy translated ~6 units down-right). NO halftone,
       NO grain, NO distress, NO distortion. Palette: jersey-deep #008755, cream #f5f1e6, ink
       #0a0a0a (never bright #3aaa35). Every part — crown · shield · 5 stripes · 55 · KCVV ELEWIJT ·
       football + pentagons — stays crisp.</p>
  </div>
  {sections}
</body>
</html>'''
    return html


def main():
    with open(os.path.join(HERE, "kcvv-crest-bold-faithful.svg"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n' + asset_faithful() + "\n")
    with open(os.path.join(HERE, "kcvv-crest-bold-retro.svg"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n' + asset_retro() + "\n")
    with open(os.path.join(HERE, "compare.html"), "w") as f:
        f.write(build_html())
    print("wrote compare.html, kcvv-crest-bold-faithful.svg, kcvv-crest-bold-retro.svg")


if __name__ == "__main__":
    main()

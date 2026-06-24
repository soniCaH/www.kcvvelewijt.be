#!/usr/bin/env python3
"""
Build CLEAN, LITERAL retro recolors of the real KCVV crest.

NO texture, NO halftone, NO grain, NO misregister, NO distortion.
Just faithful sharp recolors of the real vector geometry.

Geometry is parsed VERBATIM from the source SVG at runtime so the recolors are
byte-exact copies of the real artwork (no hand-transcription drift):
  apps/web/public/images/logos/kcvv-crest.svg (viewBox 0 0 566.93 566.93)

Source path/rect order (from the source document):
  paths[0]  CLIP_BODY  (cls-1, clipPath "clippath")
  paths[1]  CLIP_55    (cls-1, clipPath "clippath-1")
  paths[2]  G1_LINE    (cls-7) outer dark outline
  paths[3]  G1_BODY    (cls-9) green shield body
  paths[4]  G1_PANEL   (cls-5) white lower panel (clip backdrop)
  paths[5]  G3_LINE    (cls-7) band dark outline (2-piece)
  paths[6]  G3_PANEL   (cls-5) white "55" panel backdrop
  paths[7..11] STRIPES_UPPER (cls-9) 5 stripes in the "55" panel (clipped)
  paths[12] G5_LINE_7  (cls-7) band/contour outline
  paths[13] G5_LINE_8  (cls-8) identical duplicate of paths[12] — drawn once here
  paths[14] G5_CROWN   (cls-9) crown
  paths[15] G5_BALL    (cls-5) white football base circle
  paths[16] G5_PENTAGON(cls-7) football pentagons + outer ring
  rects[0..4] STRIPES_LOWER (cls-9, clipped by CLIP_BODY) 5 lower stripes

Roles a caller assigns a colour to (per version):
  body, stripe, panel, line, crown, footballbase, pentagon
A role colour of "none" omits that path entirely (used for transparent grounds).
"""
import os
import re

_SRC = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "..",
    "apps", "web", "public", "images", "logos", "kcvv-crest.svg",
)
_SRC = os.path.normpath(_SRC)


def _load():
    svg = open(_SRC).read()
    paths = re.findall(r'<path[^>]*\bd="([^"]+)"', svg)
    rects = re.findall(
        r'<rect[^>]*\bx="([^"]+)"[^>]*\by="([^"]+)"[^>]*\bwidth="([^"]+)"[^>]*\bheight="([^"]+)"',
        svg,
    )
    assert len(paths) == 17, f"expected 17 source paths, got {len(paths)}"
    assert len(rects) == 5, f"expected 5 source rects, got {len(rects)}"
    return paths, rects


_PATHS, _RECTS = _load()

CLIP_BODY = _PATHS[0]
CLIP_55 = _PATHS[1]
G1_LINE = _PATHS[2]
G1_BODY = _PATHS[3]
G1_PANEL = _PATHS[4]
G3_LINE = _PATHS[5]
G3_PANEL = _PATHS[6]
STRIPES_UPPER = _PATHS[7:12]
G5_LINE_7 = _PATHS[12]
G5_CROWN = _PATHS[14]
G5_FOOTBALL_BASE = _PATHS[15]
G5_FOOTBALL_PENTAGONS = _PATHS[16]
# lower stripes as (x, y, w, h)
STRIPES_LOWER = _RECTS


def _crest_body(uid, roles, fill55, fillword):
    """Return the crest's inner markup (no <svg> wrapper, no <defs>).

    Emits the clipPaths inline-less version — clipPaths are declared by the caller in a
    shared <defs> so the same uid's clip ids resolve. roles keys: body, stripe, panel,
    line, crown, footballbase, (pentagon optional). fill55 / fillword: explicit fills for
    the live <text>. A role value of "none" omits that path (transparent ground).
    """
    cp_body = f"clippath-{uid}"
    cp_55 = f"clippath1-{uid}"

    body = roles["body"]
    stripe = roles["stripe"]
    panel = roles["panel"]
    line = roles["line"]
    crown = roles["crown"]
    ball = roles["footballbase"]
    pent = roles.get("pentagon", line)

    def path(fill, d):
        if fill == "none":
            return ""
        return f'<path fill="{fill}" d="{d}"/>'

    lower_stripes = (
        "".join(
            f'<rect fill="{stripe}" x="{x}" y="{y}" width="{w}" height="{h}"/>'
            for (x, y, w, h) in STRIPES_LOWER
        )
        if stripe != "none"
        else ""
    )
    upper_stripes = (
        "".join(f'<path fill="{stripe}" d="{d}"/>' for d in STRIPES_UPPER)
        if stripe != "none"
        else ""
    )

    parts = []
    # Group 1: outer dark outline (behind) → green body → white lower panel.
    parts.append("<g>")
    parts.append(path(line, G1_LINE))
    parts.append(path(body, G1_BODY))
    parts.append(path(panel, G1_PANEL))
    parts.append("</g>")

    # Group 2: lower stripes (clipped to the lower panel silhouette).
    if lower_stripes:
        parts.append(f'<g clip-path="url(#{cp_body})">{lower_stripes}</g>')

    # Group 3: band dark outline → white "55" panel backdrop.
    parts.append("<g>")
    parts.append(path(line, G3_LINE))
    parts.append(path(panel, G3_PANEL))
    parts.append("</g>")

    # Group 4: upper stripes (clipped to the "55" panel silhouette).
    if upper_stripes:
        parts.append(f'<g clip-path="url(#{cp_55})">{upper_stripes}</g>')

    # Group 5: band/contour outline (source duplicates cls-7/cls-8 identically; drawn
    # once for a clean keyline) → crown → white football base → dark pentagons on top.
    parts.append("<g>")
    parts.append(path(line, G5_LINE_7))
    parts.append(path(crown, G5_CROWN))
    parts.append(path(ball, G5_FOOTBALL_BASE))
    parts.append(path(pent, G5_FOOTBALL_PENTAGONS))
    parts.append("</g>")

    # Live text — Archivo 800, explicit fills, verified visible.
    # Archivo is wider than the original Gotham-Medium, so the wordmark is sized to fit
    # the band keyline and centred on the crest axis (x=283.5). PRODUCTION must OUTLINE
    # these two strings to <path>s from the .ai — see XML comment in the asset files.
    if fillword != "none":
        parts.append(
            f'<text x="283.5" y="331" fill="{fillword}" text-anchor="middle" '
            f'font-family="Archivo, system-ui, sans-serif" font-weight="800" font-size="29" '
            f'letter-spacing="-0.2">KCVV ELEWIJT</text>'
        )
    if fill55 != "none":
        parts.append(
            f'<text x="194" y="249.01" fill="{fill55}" text-anchor="middle" '
            f'font-family="Archivo, system-ui, sans-serif" font-weight="800" font-size="86.3" '
            f'letter-spacing="-2">55</text>'
        )
    return "".join(parts)


def _flat_silhouette(uid, flat, dx, dy):
    """Return a single flat-colour copy of the WHOLE crest, translated by (dx, dy).

    Every role is forced to one flat colour (`flat`) so the back copy is a clean,
    single-colour mis-registered duplicate — a tasteful 2-colour print offset, NO
    texture. The "55" panel + football base are part of the silhouette here (rendered
    in `flat`) so the offset reads as a solid ghost of the full crest, not a hollow
    outline. The text is also flat so the 55 / wordmark ghost behind their printed copies.
    """
    flat_roles = {
        "body": flat, "stripe": flat, "panel": flat,
        "line": flat, "crown": flat, "footballbase": flat, "pentagon": flat,
    }
    inner = _crest_body(uid, flat_roles, flat, flat)
    return f'<g transform="translate({dx} {dy})">{inner}</g>'


def crest_svg(uid, roles, fill55, fillword, extra_svg_attrs="", offset=None):
    """Return a full <svg> with all ids suffixed by uid and fills from `roles` dict.

    offset: optional (flat_colour, dx, dy) tuple. When set, a single flat-colour copy of
    the whole crest is rendered BEHIND the main crest, translated by (dx, dy) — a clean,
    subtle 2-colour print mis-registration. No texture, no grain, sharp edges.
    """
    cp_body = f"clippath-{uid}"
    cp_55 = f"clippath1-{uid}"
    # The offset copy's stripe clips live INSIDE its translated <g>, so the clip geometry
    # is in the group's local (untranslated) space — plain (untranslated) clipPaths,
    # uniquely suffixed so they don't collide with the main crest's clip ids.
    uid_off = f"{uid}-off"
    cp_body_off = f"clippath-{uid_off}"
    cp_55_off = f"clippath1-{uid_off}"

    parts = []
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 566.93 566.93"{extra_svg_attrs}>'
    )
    parts.append("<defs>")
    parts.append(f'<clipPath id="{cp_body}"><path d="{CLIP_BODY}"/></clipPath>')
    parts.append(f'<clipPath id="{cp_55}"><path d="{CLIP_55}"/></clipPath>')
    if offset is not None:
        parts.append(f'<clipPath id="{cp_body_off}"><path d="{CLIP_BODY}"/></clipPath>')
        parts.append(f'<clipPath id="{cp_55_off}"><path d="{CLIP_55}"/></clipPath>')
    parts.append("</defs>")

    if offset is not None:
        flat, dx, dy = offset
        parts.append(_flat_silhouette(uid_off, flat, dx, dy))

    parts.append(_crest_body(uid, roles, fill55, fillword))
    parts.append("</svg>")
    return "".join(parts)


if __name__ == "__main__":
    s = crest_svg(
        "x",
        {
            "body": "#008755", "stripe": "#008755", "panel": "#f5f1e6",
            "line": "#0a0a0a", "crown": "#0a0a0a", "footballbase": "#f5f1e6",
            "pentagon": "#0a0a0a",
        },
        "#008755", "#f5f1e6",
        offset=("#0a0a0a", 6, 6),
    )
    print(len(s), "chars; geometry loaded verbatim from", _SRC)

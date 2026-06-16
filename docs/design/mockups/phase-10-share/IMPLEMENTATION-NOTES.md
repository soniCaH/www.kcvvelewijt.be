# /share redesign (#2156) — implementation notes

Running record of locked facts + constraints gathered during the design drill.
Feeds the eventual `/spec`. Not the design itself (see `sh*-*.html` compare pages).

## Output formats

- **9:16 Story (1080×1920)** — all 9 in-match templates. The proven, kept format.
- **1:1 Square (1080×1080)** — NEW, scoped to **pre-game + result only** (feed posts).
- Both captured client-side from a live DOM node via `html-to-image` `toPng()`
  (`apps/web/src/components/share/SharePage/SharePage.tsx`). No `next/og`/satori.

## Image system

- Showcase templates accept an **optional image**, rendered **fullscreen newsprint**
  (sepia + paper-grain) under a jersey-deep gradient overlay. Image-capable:
  **Aftrap · Rust · Goal KCVV · Eindstand · both squares**. Cards + opponent-goal
  are graphic-only (filled, no photo).
- **Image resolution chain (Goal KCVV / player moments):**
  1. optional **manual upload** on the share form (NEW)
  2. Sanity **`celebrationImage`** (`player.repository` → `celebrationImageUrl`;
     schema field literally _"Used for first-team Instagram share cards"_) — sparse
  3. **`psdImage`** rectangular portrait (~90% coverage)
  4. **filled no-photo fallback** layout
- No-image states are **filled** (jersey-stripe ground, giant ghost numeral/letter,
  blown-up card graphic) so nothing reads "empty".

## ⚠️ Image upload — MUST support native mobile uploads

The social-media manager is pitch-side on a **phone**. The new upload input must
trigger the **native mobile photo/camera picker**:

- `<input type="file" accept="image/*">` — on iOS/Android this surfaces
  Photo Library / Take Photo / Files natively.
- Consider `capture="environment"` ONLY as an opt-in "take new photo" affordance —
  do **not** set it on the primary input, since `capture` forces the camera and
  blocks choosing an existing library photo. Primary input = no `capture`.
- Read the file client-side via `URL.createObjectURL(file)` (or `FileReader` →
  data URL) and feed it straight to the template `<img src>` — no server upload,
  no Sanity write. It only needs to live long enough for `html-to-image` to capture.
- Revoke object URLs on replace/unmount.
- `html-to-image` caveat: object-URL / data-URL images are same-origin and capture
  cleanly (unlike remote `crossOrigin` images). Verify capture at full 1080px.

## Tokens & fonts (Phase 9 §4–§5)

- Retire inline `#008755`/`#4acf52`/`#121a14`/`#f59e0b`/`#dc2626` → retro tokens:
  `jersey-deep` / `cream` / `ink` / `warm` / `brick`(`card-red` #c93f1c) / `jersey-deep-dark`.
- **Retire Quasimoda** (`TITLE_FONT` in `constants.ts`) → **Freight Display**
  (`--font-display`); Montserrat body kept; IBM Plex Mono for mono labels.
- Square corners, ink borders + hard offset shadow, paper-grain, newsprint COLOUR photos.

## Voice (locked through sh4)

- **A+B hybrid**: register B (jersey-deep poster) for loud KCVV-positive shouts
  (Goal, win); register A (cream sheet) for calmer/sober; accent carries sentiment
  (warm/jersey = +, brick/ink = −).
- **Headline = `Goal!`** — warm `!` on positive shouts, sober `.` elsewhere.
- Per-event distinct layouts (fixture / goal / scoreboard / disciplinary / result)
  - cream/dark rhythm = the "stays interesting" requirement.

## Sign-off (sh4 + fixes)

Owner: _"Rest is a good starting point, will check the implementations for details
on designs!"_ — **direction locked** on sh4. Finer per-element design details are
delegated to implementation (owner will review in the running app / Storybook).

Final fixes folded into `sh4-image-system-and-fills.html`:

- **#4 no-photo goal** — was overflowing the frame: `.vB > * { position: relative }`
  was overriding the absolute decoration layers, flowing the stripe-ground inline and
  pushing the scorer out the bottom. Fixed with a higher-specificity
  `.vB > .stripeground, .vB > .ghostnum { position: absolute }`. **Lesson for the real
  templates: never let a blanket child rule clobber an absolutely-positioned decoration;
  keep a fixed per-zone vertical budget so content can never overflow 1080×1920.**
- **#10–12 results** — `teams · competition` was risking overflow on one line; the
  **competition now sits on its own line** under the team line. Apply the same
  team-line / competition-line split anywhere both appear.

## Deferred to implementation (owner will check details)

- #8 Rood · KCVV — cream-sober vs dark/dramatic (register B): decide in-app.
- Whether Eindstand (#10–12) also accepts a fullscreen image like the square result.
- Exact type scale, rotation amounts, overlay opacity, tape/seam placement per card.

## html-to-image capture checklist (verify in implementation)

- Freight Display (Adobe kit) loaded + `document.fonts.ready` before capture.
- `clip-path` not used in new design (legacy torn-polygon retired) — fewer capture risks.
- CSS custom properties: inline-style the computed token values OR confirm
  `html-to-image` resolves `var(--…)` at capture (legacy templates used inline hex
  precisely to avoid this — re-verify before relying on Tailwind classes in templates).
- Paper-grain / halftone are inline SVG data-URLs (same-origin, capture-safe).

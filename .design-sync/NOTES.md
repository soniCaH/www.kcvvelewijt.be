# design-sync notes — KCVV Elewijt Design System

Target project: `8cc4a019-6007-44d8-bd15-70ea439ddf88` (https://claude.ai/design/p/8cc4a019-6007-44d8-bd15-70ea439ddf88)

## Repo shape (this is a Next.js app, not a published component library)

- `pkg` is `@kcvv/web`; there is **no `dist/`**. The bundle is built from a source
  entry: `.design-sync/entry.ts` (re-exports the `design-system` + `layout` barrels).
  `--node-modules` points at `apps/web/node_modules` (where `react` 19 resolves).
- **Scope: UI + Layout only** (owner decision). Features (119) + Pages (20) are
  deferred — domain/Next/Sanity-coupled, less reusable by the design agent. Add on a
  later re-sync (files + grades carry forward).
- Scoping is done by the **scoped Storybook config** `apps/web/.sb-dssync/` (narrows the
  `stories` glob to the `design-system/**` + `layout/**` dirs), not by titleMap.

## Build inputs (committed, durable)

- `.design-sync/entry.ts` — bundle entry (both barrels + CookiePreferencesButton).
- `.design-sync/tsconfig.build.json` — `@/*` → `apps/web/src/*` plus `next/*` shim paths.
- `.design-sync/shims/` — `next/image`→`<img>`, `next/link`→`<a>`, `next/navigation`
  stubs, `next/script`→no-op. The esbuild bundler has no built-in Next shim; these are
  wired via the build tsconfig `paths`.
- `apps/web/.sb-dssync/` — scoped SB config (main + preview re-export + Typekit head).

## Fonts

- Brand fonts (Freight Display/Big/Sans) ride **Adobe Typekit** at runtime
  (`https://use.typekit.net/cvo5raz.css`), loaded via `preview-head.html`. Set
  `runtimeFontPrefixes: ["freight-", "Freight ", "quasimoda"]` to suppress
  `[FONT_MISSING]`. TODO: confirm the Typekit `@import` reaches `styles.css` so shipped
  designs actually get Freight (else wire a small cssEntry that @imports it).

## Export surface + prop types (the converter expects a built package)

- This app ships no `dist/`/`.d.ts`. The converter derives the "public export" set
  (which storybook titles are real components) and prop bodies from a `.d.ts`
  surface. We synthesize one:
  - `.design-sync/package.json` (`name: @kcvv/web-dssync`, `types: ./dts-entry.d.ts`)
    makes `PKG_DIR` resolve to `.design-sync` (the walk-up stops at the first
    package.json with a name). This also means **cfg path fields are resolved
    relative to `.design-sync`** — so `tsconfig`/`cssEntry` in config are bare
    names (`tsconfig.build.json`, `sb-compiled.css`), NOT `.design-sync/…`.
  - `tsc -p .design-sync/tsconfig.dts.json` emits real declarations to
    `.design-sync/dist-types/` (gitignored); `dts-entry.d.ts` re-exports them.
  - `@types/react` only lives at `apps/web/node_modules`; the dts walk-up needs it
    at repo root → symlink `node_modules/@types/{react,react-dom}` (fresh-clone step).
- `QASectionDivider` + `SubjectAvatar` have stories but are NOT in the design-system
  barrel → added explicitly to `entry.ts` + `dts-entry.d.ts`.
- `UI/Divider` story renders `DashedDivider`/`DottedDivider` (no `Divider` export) →
  `titleMap: {"Divider": "DashedDivider"}`.

## `@/`-alias-to-directory bundling bug (converter can't be forked)

- The esbuild bundler resolves `@/*` via a tsconfig-paths plugin whose ext-probe
  starts with `''`, so `@/x/Button` (a DIRECTORY) resolves to the dir → EISDIR.
  Fix: `.design-sync/gen-build-tsconfig.mjs` emits an EXACT `paths` entry per
  dir-alias import (→ its index file), ordered BEFORE the `@/*` wildcard, into
  `tsconfig.build.json`. Re-run it if new `@/…/Dir` imports appear.

## CSS — IMPORTANT re-sync gotcha

- Tailwind v4 (`src/app/globals.css`). The compiled utilities live in the storybook
  build: `sb-reference/assets/iframe-<hash>.css` (the local `<link>` in iframe.html).
- The `[CSS_FROM_STORYBOOK]` auto-scrape ONLY fires when `_ds_bundle.css` is a
  placeholder. Here `CookieConsentBanner` imports `vanilla-cookieconsent`'s CSS, so
  `_ds_bundle.css` is real (~37KB) → the scrape is SKIPPED and Tailwind never ships
  (previews render UNSTYLED). Fix: copy the linked compiled CSS to a stable name and
  point `cssEntry` at it (it APPENDS to `_ds_bundle.css`, keeping cookieconsent):
  ```sh
  LINK=$(grep -oE 'href="\./assets/[^"]+\.css"' .design-sync/sb-reference/iframe.html | head -1 | sed -E 's/.*\/(.*)"/\1/')
  cp ".design-sync/sb-reference/assets/$LINK" .design-sync/sb-compiled.css
  ```
  `cssEntry: "sb-compiled.css"` (bounded to PKG_DIR). **Re-do this copy after every
  sb-reference rebuild** (the hash changes). `sb-compiled.css` is gitignored.

## Re-sync

- Before the converter: rebuild `.design-sync/sb-reference` from `apps/web`
  (`npx storybook build -c apps/web/.sb-dssync -o <repo-root>/.design-sync/sb-reference`)
  AND re-copy staged scripts. There is no dist `buildCmd`.

## Component findings (wave 1) — overrides + asset policy

- **CookieConsentBanner** — `vanilla-cookieconsent` only mounts after `run()` on
  mount; the static story renders nothing on BOTH panels (sb-error). All 3 stories
  `skip`ped → ships as a floor card. Not fixable from a preview.
- **NavTakeover** — the `fixed inset-0` overlay stories (Open, Open With Submenu
  Expanded) collapse to h=0 because the `.ds-single` card wrapper has
  `transform: translateZ(0)` (becomes the fixed panel's containing block).
  `cardMode:single` + `primaryStory:Open` + `viewport:430x900` gives it a real
  containing block. NavTakeoverItem sub-stories render fine.
- **SiteHeader** — `Drawer Open` is `play()`-driven (clicks the hamburger) AND the
  drawer IS `<NavTakeover>` (same overlay collapse) → that story `skip`ped; Default +
  No Dynamic Teams match.

### [GENERAL] Public/served assets 404 in the preview origin

- Stories referencing absolute served paths (`/images/*`, `/test-fixtures/*`,
  `/fonts/*`) load on the Storybook panel (the sb build copies `public/` +
  `test/fixtures`) but 404 on the preview panel — the preview origin (`ds-bundle/`)
  serves none of them. This is a **real, shipped delta**: the uploaded card 404s too.
- **Policy (do NOT copy `public/` into `ds-bundle/`** — that fixes the compare but
  NOT the shipped card, i.e. a false-pass):
  - Small logo/avatar passed as a **prop** → author an owned preview inlining it as a
    base64 data URI (origin-independent, ships correct → `match`). Done for `Crest`.
  - Component-**internal** hardcoded `<img src="/images/…">` (can't override from a
    preview) or a large photo → grade `close` with a note (component intact; fixture
    asset 404s in-preview — env gap, not a defect). Done for `SiteFooter` (crest).

## Component findings (wave 2)

- **SubjectAvatar** — photo stories used a served `/test-fixtures/*.webp` (404 in preview) →
  owned preview inlines the 14KB fixture as base64 (per the asset policy). Monogram/initials
  stories unaffected.
- **PageHero** — With Image / Long Headline are `close` (served hero photo 404s; large photo,
  not inlined). Typographic variants match.
- **ScrollArrowButton** — "Both Directions": the sb oracle crops at ~224px so the `right-0`
  button falls outside its shot; the preview (900px) shows both. Framing artifact → match.
- **STORY_CAP tails** (verified-by-upload, not individually graded): Spinner 6/12, Alert 6/9,
  AlertBadge 6/10, MonoLabel 6/17, TapeStrip 6/12, StripedSeam 6/10, several 6/8–10. Raise
  `--max-stories` on a future sync if a tail variant needs individual verification.

## Re-sync risks

- Shims are hand-written; if a component starts using a Next API the shims don't cover
  (e.g. `next/font`, `next/headers`), the bundle build will fail — extend the shim.
- MatchStrip\* live under `layout/` but are Features (server `match-data`); the scoped
  glob pulls their stories — exclude via `titleMap: {<title>: null}` if they surface.
- `vanilla-cookieconsent` (CookieConsentBanner / CookiePreferencesButton) initialises on
  mount; may need a skip/override if it throws in the preview.

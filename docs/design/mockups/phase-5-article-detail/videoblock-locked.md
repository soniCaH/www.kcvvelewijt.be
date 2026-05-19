# videoBlock — locked (drill 5.d-vid / #1840 drill 4)

**Drill:** 5.d-vid · Two visual rounds + width inheritance · #1840 drills 4.1 + 4.2
**Locked:** 2026-05-19 by @climacon
**Mockups:**

- `5d-vid/round-1-frame-comparisons.html`
- `5d-vid/round-2-play-affordance-comparisons.html`

---

> This lock supersedes the legacy `VideoBlock` in `apps/web/src/components/article/VideoBlock/VideoBlock.tsx` (black-bg figure, 4px rounded corners, native HTML5 controls always, boolean `fullBleed`). The locked Phase 5 rendering frames the player in the same flat `<TapedFigure>` as `<articleImage>`, adds a KCVV-branded play affordance on the upload path, and inherits the `width: 'prose' | 'wide' | 'bleed'` enum from drill 3.

## What this drill resolves

- ✅ **R1 — Frame:** Option A (match articleImage — flat TapedFigure, single ochre tape strip top-center, cream-white frame, ink-subtle border, offset shadow).
- ✅ **R2 — Play affordance (upload path):** Option C (bottom-left mono caps pill, triangle glyph + label "Afspelen", jersey-deep bg + ink border + offset shadow).
- ✅ **Width enum:** inherit articleImage R3 — `width: 'prose' | 'wide' | 'bleed'`. Mobile fallback: `wide → prose`. Bleed suppresses tape.
- ✅ **Caption rendering:** italic Freight body-sm, matches articleImage figcap typography (the existing videoBlock `caption: string` field stays as-is).

## What this drill does NOT decide

- **Embed path play UI** — YouTube/Vimeo render their own provider chrome inside the privacy-enhanced iframe. Nothing we draw inside the frame influences that. Our frame (locked R1 A) wraps the iframe identically to the upload path; the provider's play button sits inside the iframe.
- **Custom controls bar during playback** — explicitly out of scope. On click, our corner pill + poster hide and native HTML5 controls take over for the rest of the session. No KCVV-branded scrubber, fullscreen, volume.
- **Analytics integration** — `article_video_play` / `article_video_complete` instrumentation from #1366 is preserved verbatim. The custom play button click handler triggers `onPlay` analytics in parallel with native playback start.

## Locked field rendering

### `videoBlock` schema (migration required)

```typescript
defineType({
  name: 'videoBlock',
  fields: [
    {name: 'uploadedFile', type: 'file', /* unchanged */},
    {name: 'embedUrl', type: 'url', /* unchanged */},
    {name: 'poster', type: 'image', options: {hotspot: true}, /* unchanged */},
    {name: 'caption', type: 'string', /* unchanged */},
    {name: 'width', type: 'string', options: {list: ['prose', 'wide', 'bleed']}, initialValue: 'prose'},
    // fullBleed: boolean — REMOVED in migration
  ],
  validation: /* XOR uploadedFile/embedUrl — unchanged */,
})
```

**Migration:** bundled with the `articleImage.fullBleed → width` migration from drill 3.2. Same translation rule:

```typescript
fullBleed === true  → width: 'bleed'
fullBleed !== true  → width: 'prose'
unset fullBleed in all videoBlock objects
```

### Render — upload path

```tsx
<TapedFigure
  aspect="landscape-16-9"   // forced 16:9 for video, never auto
  tape={{ color: 'ochre', length: 'sm', position: 'top-center', rotation: -2 }}
  caption={value.caption?.trim() || undefined}
  bg="cream"
  tint="none"   // newsprint tint shifts video poster colors; "none" preserves them
  // width behaviour inherited from articleImage R3 lock
>
  <div className="relative">
    {!isPlaying && value.poster && (
      <Image src={value.poster.url} alt="" fill className="object-cover" />
    )}
    {!isPlaying && (
      <button
        type="button"
        onClick={onPlayClick}
        aria-label="Speel video af"
        className="absolute bottom-4 left-4 inline-flex h-9 items-center gap-2 border border-ink bg-jersey-deep px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-cream shadow-paper-press transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
      >
        <PlayTriangleIcon className="h-3.5 w-3.5" />
        Afspelen
      </button>
    )}
    {isPlaying && (
      <video
        ref={videoRef}
        src={value.uploadedFile.asset.url}
        controls
        autoPlay
        playsInline
        onPlay={handleAnalyticsPlay}
        onEnded={handleAnalyticsComplete}
        className="block h-full w-full"
      />
    )}
  </div>
</TapedFigure>
```

### Render — embed path

```tsx
<TapedFigure aspect="landscape-16-9" tape={…} bg="cream" tint="none">
  <iframe
    src={parsedEmbedUrl}              // youtube-nocookie.com / player.vimeo.com
    title={value.caption ?? "Video"}
    allow="accelerated-2d-canvas; autoplay; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    referrerPolicy="strict-origin-when-cross-origin"
    className="block h-full w-full border-0"
  />
</TapedFigure>
```

Provider chrome (YT/Vimeo play button + controls) sits inside the iframe. The TapedFigure frame, tape strip, and figcaption are ours.

### Width rules (inherited from articleImage R3 / R3b)

| Width | Desktop ≥ 640px | Mobile &lt; 640px | Tape |
| --- | --- | --- | --- |
| `prose` (default) | 680px | viewport - padding | ✅ |
| `wide` | ~1040px | collapses to prose | ✅ |
| `bleed` | 100vw | 100vw | ❌ suppressed |

`tint="none"` on every video (unlike articleImage's `tint="newsprint"`) — the newsprint sepia would shift video poster colours wrongly.

### Play affordance contract

- **Pill geometry:** 36px height · `px-4` padding · `h-3.5 w-3.5` triangle icon · 8px gap · `border-ink` 1px · `shadow-paper-press` offset shadow.
- **Position:** `absolute bottom-4 left-4` inside the 16:9 video container.
- **Hover:** canonical press-down (per `feedback_canonical_press_down_hover`) — `hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-300`.
- **Label:** Dutch caps "Afspelen" — locked, not editor-authored.
- **Triangle:** locked `M8 5v14l11-7z` 24×24 viewBox · `fill="currentColor"` (cream on jersey-deep).
- **Click handler:** sets `isPlaying = true`, hides poster + pill, mounts `<video controls autoPlay>`. Native HTML5 controls take over from here.
- **Visibility on first paint:** pill is the ONLY click target — clicking the poster image itself does nothing (the pill is what's interactive). This keeps the affordance honest.

### Caption rendering

`caption: string` (existing schema field, unchanged) renders via TapedFigure's `figcap` slot — italic Freight body-sm 14px, color `--color-ink-soft`. Matches the locked articleImage figcap typography 1:1. Skipped entirely when blank.

## Component contract

**Path:** `apps/web/src/components/article/VideoBlock/VideoBlock.tsx` (refactor existing file; do not create a Phase-5-only sibling — `<SanityArticleBody>` will retire and the new renderer is the only one).

**Storybook stories required** (per `feedback_state_coverage_stories`):

- Upload path · with poster · before play · prose width
- Upload path · without poster · before play (black 16:9 + pill on black)
- Upload path · playing state (native controls visible)
- Embed path · YouTube
- Embed path · Vimeo
- prose / wide / bleed width variants
- Mobile viewport · prose / wide collapsed / bleed
- With caption · without caption (figcap omitted)

## Net new vocabulary / schema

- **Schema:** remove `videoBlock.fullBleed`, add `videoBlock.width: 'prose' | 'wide' | 'bleed'`. One Sanity migration (bundled with articleImage's identical migration in the same PR).
- **Tokens:** none new. Reuses `--container-prose`, `--container-wide` (added in drill 3), jersey-deep, ink, cream, ochre tape.
- **Component:** none new. Refactor existing `<VideoBlock>` to use TapedFigure + the locked play pill.

## Downstream impact

- **#1829 (5.B body migration)** — this drill unblocks the `<ArticleBody>` videoBlock serializer wiring. Migration ships the refactored `<VideoBlock>` + the Sanity migration (bundled with articleImage).
- **Analytics (#1366)** — preserved. Custom pill click handler chains into native playback start; existing `onPlay`/`onEnded` analytics fire as before. Embed-path analytics keep the `window` blur heuristic from the legacy code.
- **Newsprint tint** — explicit `tint="none"` on videoBlock distinguishes it from articleImage's `tint="newsprint"`. Worth a one-liner in the TapedFigure docs.
- **Studio UX** — editors see a new width dropdown (prose / wide / bleed) on each video block. Same dropdown lands on articleImage; consistent control across both block types.

## Source-of-truth

- Mockup HTML: paths listed above.
- Schema: `packages/sanity-schemas/src/videoBlock.ts` (migration in same PR as #1829).
- Existing reference: `apps/web/src/components/article/VideoBlock/VideoBlock.tsx` (legacy renderer being refactored).
- Sibling lock: `docs/design/mockups/phase-5-article-detail/articleimage-locked.md` (width enum + mobile fallback inherited).
- Memories consumed: `feedback_reuse_approved_primitives`, `feedback_sanity_migrations`, `feedback_canonical_press_down_hover`, `feedback_state_coverage_stories`.

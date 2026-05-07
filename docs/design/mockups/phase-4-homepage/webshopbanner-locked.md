# Phase 4 · `<WebshopBanner>` — Locked

**Locked 2026-05-07 across rounds 9 (rejected — wrong premise), 9b (P.3 picked), 9c (rejected — image treatments).**
**Renamed from `<WebshopStrip>` to `<WebshopBanner>`.**

## What changed vs the original Phase 4 issue

Issue #1526 originally described `<WebshopStrip>` as "4-column jersey thumbnails." Round 9
revealed that **KCVV does not run an in-site store** — every transaction goes to an external
supplier — so a 4-thumbnail product gallery would advertise items the supplier may not stock,
require seasonal asset maintenance, and mislead visitors. Section reframed as a banner pointer
(no specific products); renamed to `<WebshopBanner>`.

## Composition

```text
<WebshopBanner>                                 // server component
  <div class="jersey-deep-band tape-strip">
    <span class="meta">WEBSHOP · onze partner</span>
    <h2><EditorialHeading><span className="accent">Trainingsgear</span> bestel je rechtstreeks bij onze partner.</EditorialHeading></h2>
    <p className="lead">Trainingskledij, clubpakketten en personalisatie voor onze jeugd- en seniorenspelers.</p>
    <a href={EXTERNAL_LINKS.webshop} target="_blank" rel="noopener">
      Naar de webshop ↗
    </a>
  </div>
```

## Spec

| Aspect | Value |
| --- | --- |
| Section background | Solid `var(--ink)` (revised after adjacency review) |
| Top tape strip | Full-width jersey-tape green strip (-0.5° rotation, 18px tall, top -12px) — same colour as before, now contrasts against ink |
| Text colour | `var(--cream)` |
| Accent colour | `#f0c264` (warm yellow) on "Trainingsgear" |
| Headline | `<EditorialHeading>` italic, accent decorator on "Trainingsgear" |
| Lead | "Trainingskledij, clubpakketten en personalisatie voor onze jeugd- en seniorenspelers." |
| CTA | Cream paper button, ink text, jersey-deep shadow, `↗` external indicator |
| External link | `EXTERNAL_LINKS.webshop` constant (existing) |
| Hover | Canonical press-down on the CTA |
| Image | None |
| Editor input | None — pure code |

## Locked decisions

| Round | Decision | Rationale |
| --- | --- | --- |
| 9 | ~~4 product thumbnails~~ → **rejected** | KCVV doesn't sell — no specific products to advertise |
| 9b | **P.3 · Wide jersey-tape banner** | Most minimal info density, strongest typographic moment, single CTA |
| 9c | ~~Incorporate jerseys.png~~ → **rejected** | Owner preferred solid-colour version after seeing image treatments |

## Adjacency resolved

WebshopBanner originally locked as jersey-deep, which created two adjacent jersey-deep bands
with YouthBlock. Owner-locked fix (2026-05-07): **WebshopBanner uses solid ink instead of
jersey-deep**. This contrasts cleanly with YouthBlock's jersey-deep + photo backdrop and reads
as a "press release / classified ad" register. Tape strip stays jersey-tape green (now
contrasts against ink rather than blending).

```text
[YouthBlock jersey-deep + photo backdrop] ← green
[WebshopBanner ink]                       ← dark band (contrast)
[bannerSlotC cream]                       ← cream beat
[SponsorsBlock cream-deep]                ← cream close
```

Three-tone rhythm: green → ink → cream-pair, ending the page on the lighter notes.

## Reuse mandate

Banner composes:
- `<EditorialHeading>` with accent decorator (Phase 1)
- `<TapeStrip>` (Phase 0) for the top jersey-tape band
- `<MonoLabel>` (Phase 0) for the "WEBSHOP · onze partner" meta line
- `<Button variant="primary">` (Phase 2 atom rework) for the CTA

No new primitives.

## VR baseline contract

- Story: `Home/WebshopBanner/Default` — desktop, full banner
- Story: `Home/WebshopBanner/Mobile` — viewport at 375px
- VR-tag both. No image / no live data — fully deterministic.

## Out of scope

- Photo asset experimentation (already drilled in 9c — owner explicitly rejected).
- Sanity-driven copy or CTA URL — stays hardcoded, `EXTERNAL_LINKS.webshop` is the single source.
- Per-category deep-links to the external supplier (verifiable later — not Phase 4 design concern).

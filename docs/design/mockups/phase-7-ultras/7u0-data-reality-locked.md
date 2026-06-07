# Phase 7 · /club/ultras — Round 0 (DATA REALITY) — LOCKED

**Date:** 2026-06-07
**Owner:** @climacon
**Tracker:** #1529 (Phase 7 master)

## What the page is

The Ultras supporters page (`UltrasPage`) — a **custom, self-contained content page**, fully
**hardcoded** (no CMS/repository). Pure visual reskin.

- **Hero:** `<InteriorPageHero>` (dark) — label "Supporters", headline "KCVV Ultra's", body, CTA
  **"Word lid via Facebook"** → `facebook.com/KCVV.ULTRAS.55`. Image `ULTRAS_HEADER_HERO`.
- **Body (3 hardcoded sections):**
  1. **Wie zijn we** — origin story (FB founding, 2018-19 revival, kampioenstitel) + photo
     `ULTRAS_KAMPIOEN`.
  2. **Wat doen we** — purpose (positief aanmoedigen; trommels, sfeermateriaal, bussen) +
     a **blockquote** + the **"Schijt je rijk" event** highlight (_ALLE 500 lotjes_, _€750 cheque_)
     - poster `ULTRAS_SJR`.
  3. **Lid worden** — join via Facebook + a Facebook button.
- Legacy: dark hero, green-left-border `h2`s, `rounded-lg` images.

## Notable

- **This page IS the terrace/fanzine subject** — sfeeracties, trommels, spandoeken, bengaals vuur.
  It can lean hardest into the retro-terrace-fanzine vocabulary of any Phase 7 surface.
- External CTA is **Facebook** (the only "join" channel) — keep it, hardened `rel`.
- "Schijt je rijk / 500 lotjes / €750" is a real, characterful highlight worth a callout.

## Reuse map (all existing primitives)

| Element                         | Reskin to                                         |
| ------------------------------- | ------------------------------------------------- |
| `<InteriorPageHero>` (dark)     | hero — register drilled in 7u1                    |
| green-left-border `h2` sections | `<MonoLabel>` kicker + `<EditorialHeading>`       |
| `rounded-lg` images             | `<TapedFigure>` (newsprint, caption)              |
| `<blockquote>`                  | `<PullQuote>`                                     |
| "500 lotjes / €750"             | a highlighted callout (TapedCard / NumberDisplay) |
| Facebook CTA                    | paper-stamp button / `<CtaBand>`                  |

## The one drill (7u1)

**Register / hero** — how loud does the Ultras page go: calm cream-editorial (consistent), bold
terrace-poster (leans into the Ultras energy), or hybrid (bold hero + cream body)? Body reskins to
editorial vocabulary regardless.

# Phase 4 · `<YouthBlock>` — Locked

**Locked 2026-05-07 across rounds 8 (rejected — over-amplified JerseyShirt), 8b (corrected after owner clarification).**

## Composition

```text
<YouthBlock>                                  // server component
  <YouthBackdrop>                             // existing component, reskinned palette
    <Image src="/images/youth-trainers.jpg" blur="2px" />
    <div className="bg-gradient (jersey-deep 90% → 75% → 50%)" />
  </YouthBackdrop>
  <div className="text-block">
    <span className="meta-line">Word jeugdspeler</span>
    <h2><EditorialHeading><span className="accent">De toekomst</span> van Elewijt.</EditorialHeading></h2>
    <p className="lead">Onze jeugdwerking groeit elk jaar. Bovenbouw, Middenbouw en Onderbouw delen één doel.</p>
    <div className="stats">
      <span className="stat"><strong>220+</strong> spelers</span>
      <span className="stat"><strong>16</strong> ploegen</span>
    </div>
    <Link href="/jeugd" className="cta">Ontdek onze jeugd →</Link>
  </div>
```

## Key decisions

| Round | Decision | Rationale |
| --- | --- | --- |
| 8 | ~~Big JerseyShirt as section visual~~ → **rejected** | "Don't like the big jersey here" — owner rejected |
| 8b | **N.2 · Today's pattern reskinned** (blurred photo + jersey-deep gradient) | Direct continuity from current `<YouthBackdrop>`, fades cleanly |

## Backdrop spec

- Photo asset: `/images/youth-trainers.jpg` (existing — kept). Future swap when a better photo is curated.
- Blur: `2px` filter blur applied to image (matches today's behavior).
- Gradient overlay: `linear-gradient(135deg, var(--jersey-deep) / 88% 0%, var(--jersey-deep) / 65% 60%, var(--jersey-deep-dark) / 92% 100%)`. Approximates today's `from-kcvv-green-dark/90 via-kcvv-green-dark/75 to-kcvv-green-dark/50` swapped to retro palette tokens.
- Mobile gradient direction: `bg-gradient-to-b` (vertical) — same as today.
- Desktop gradient direction: `md:bg-gradient-to-r` (horizontal) — same as today.

## Text + CTA

- Meta line: `Word jeugdspeler` (uppercase mono, opacity 0.7)
- Headline: `De toekomst van Elewijt.` — `<EditorialHeading>` italic with accent decorator on "De toekomst" (yellow #f0c264)
- Lead: `Onze jeugdwerking groeit elk jaar. Bovenbouw, Middenbouw en Onderbouw delen één doel: voetbal als zelfontplooiing — nooit als prestatie alleen.`
  - **Note:** This is new copy proposing a fuller lead. Verify with owner before merge — today's lead is `"Meer dan 220 jonge spelers en 16 ploegen trainen elke week op Sportpark Elewijt. Van de allerkleinsten tot de U21."` Either is acceptable; redesign vocabulary preferred.
- Stats: `220+ spelers · 16 ploegen` (hardcoded — verify accuracy at implementation time)
- Divisions: `· Bovenbouw · Middenbouw · Onderbouw` (mono uppercase line) — only if adding the divisions row reads well; cut if cluttered
- CTA: `Ontdek onze jeugd →` (cream paper button on jersey-deep) — keeping current copy; "Schrijf je in" alternative if the page becomes a sign-up funnel later.

## Hardcoded vs Sanity

YouthBlock content stays hardcoded in Phase 4 — same as today. Future Sanity migration to a
`youthLanding` document is a Phase 7 concern (jeugd landing redesign). Editor doesn't need to
touch this surface for now.

## Reuse mandate

YouthBlock composes:
- `<YouthBackdrop>` — existing component, palette swap only (kcvv-green-dark → jersey-deep tokens)
- `<EditorialHeading>` with `accent` decorator (Phase 1)
- `<MonoLabel>` (Phase 0) for the meta line and stats
- `<Button variant="primary">` (Phase 2 atom rework) for the CTA

No new primitives. The `<JerseyShirt>` primitive from Phase 3 is **NOT used in YouthBlock**
(per Round 8 owner rejection — JerseyShirt vocabulary lives elsewhere on the site, not here).

## Mobile

Mobile (<640px): same composition, gradient flips to vertical, headline scales down via clamp.
Photo asset is the same; cropping handled by `object-cover object-top` (today's behavior).

## VR baseline contract

- Story: `Home/YouthBlock/Default` — desktop with full backdrop + text
- Story: `Home/YouthBlock/Mobile` — viewport at 375px width
- VR-tag both. Photo asset is deterministic; gradient overlay is deterministic; no flake risk.

## Out of scope this section

- Photo asset replacement — Phase 4 keeps `/images/youth-trainers.jpg`. New photo curation is
  a future ticket, not a Phase 4 deliverable.
- Sanity migration of YouthBlock copy — Phase 7 jeugd landing concern.
- Lead-copy A/B — owner can confirm at implementation time which lead variant ships.

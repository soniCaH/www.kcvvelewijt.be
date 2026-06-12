# 8p1 — /privacy hero + prose · LOCKED

**Decision:** P1 — **cream minimal**. Honours the master-design directive
("clean prose, no chrome flourishes") most faithfully.

Rejected:

- **P2 (prose + sticky ToC)** — most usable for long legal text, but a sidebar is
  arguably chrome and adds mobile-collapse + scroll-spy complexity for a
  rarely-read page. Parked; revisit only if the page grows.
- **P3 (document sheet + AVG stamp)** — the taped sheet + stamp are exactly the
  chrome flourishes the directive warns against.

## Spec (LOCKED)

- **No hero band.** Header is: mono kicker `JURIDISCH` (jersey-deep) → serif italic
  title **"Privacyverklaring."** (Freight Display, accent dot jersey-deep) → mono
  last-updated line (`Laatst bijgewerkt · {LAST_UPDATED}`) → a Freight Display
  intro lead paragraph.
- **Prose column** ≈`max-w-2xl` (≈680px), cream background, **ink/cream prose —
  not the legacy gray `prose-gray`.** H2s in Freight Display (700), body in
  Archivo, links jersey-deep. `<DottedDivider>` between H2 sections.
- **Remove** the dark `<InteriorPageHero>`, the `<SectionStack>` `diagonal`
  transition, and `prose prose-gray`. No `<StripedSeam>` needed — the page is a
  single prose section with no inter-section seam (satisfies the master-design
  line-587 "migrate the diagonal consumer" by *removing* it here).
- Keep all real content + the `/hulp` cross-link + the `LAST_UPDATED` constant +
  the existing SEO metadata.

Reskin target: `apps/web/src/app/(main)/privacy/page.tsx`. Likely drops the
`SectionStack`/`InteriorPageHero` composition for a plain server component with a
cream container + the header + prose.

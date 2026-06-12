# 8s3 — /zoeken type-filter row · LOCKED (reuse, no redesign)

**Decision:** Keep `<FilterTabs>` — no new design.

`apps/web/src/components/search/SearchFilters.tsx` **already** renders the type
filter via the canonical `<FilterTabs>` (Phase 2 Track B, Direction D "paper
chrome, ink emphasis"): sharp-cornered paper chips (`border-2 border-ink` +
`bg-cream-soft` + `shadow-paper-sm`), active inverts to `bg-ink text-cream`, mono
uppercase labels, **counts inline after a 1px hairline pipe** (no pill/badge),
canonical press-down hover. Tabs: `Alles · Nieuws · Spelers · Staf · Teams`.

So this round is a reuse-lock, not a redesign. Implications:

- The rounded-pill chips sketched in the earlier `8s2`/`8s1` placeholders are
  **not** the real treatment — production already uses the sharp paper chips.
  All later Phase 8 mockups should draw the filter row as `<FilterTabs>`.
- The reskin work for `/zoeken` does **not** touch `SearchFilters` — it's already
  on the design system. Phase 8 only needs a small note that the filter row sits
  unchanged below the new dark masthead, on cream.

Reuse-mandate compliance (memory: reuse-approved-primitives). Nothing to build.

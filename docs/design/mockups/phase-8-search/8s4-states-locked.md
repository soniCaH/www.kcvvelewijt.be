# 8s4 — /zoeken empty / no-result / pre-search states · LOCKED

**Decision:** E2 — **football voice + JerseyShirt artefact**, with grown-up copy.

Rejected:

- **E1 (calm paper notes)** — calmest, but the no-result is a dead end with no way
  forward.
- **E3 (browse-instead shortcuts)** — most useful, but least personality; reads
  "app" not "fanzine" and duplicates the main nav.

## Structure (LOCKED)

- **Pre-search** (`query < 2 chars`): a single paper card — italic display
  "Waar ben je naar op **zoek**?" (accent on "zoek", jersey-deep on cream) + a
  one-line explainer + three mono type-hint chips (*Een spelersnaam · Een ploeg ·
  Een nieuwsbericht*). Replaces the current emoji "Nieuwsartikelen/Spelers/Teams"
  help block.
- **No-results** (valid query, 0 hits): paper card with a small taped
  `<JerseyShirt>` artefact + a football-pun headline + a body line that names the
  missing query and offers **inline way-forward links** (nieuws · ploegen ·
  spelers). **Contract:** these are plain `next/link` navigations to the section
  index routes (`/nieuws`, `/ploegen`, and the players index) — escape hatches out
  of the dead end. They are **NOT** `/zoeken?type=…` filter shortcuts: a
  no-results query stays empty when re-filtered by type, so a filter shortcut
  would lead nowhere. Exact players-index target confirmed at build (#2106). The
  links resolve E1's dead-end problem.
- **Loading**: existing `<Spinner>` kept — no redesign.
- **Error**: paper `<Alert>` reskin ("Er ging iets mis bij het zoeken — probeer
  opnieuw"). No direction choice.

## Owner refinement — copy

"Naast de bal" was **too childish**. Final no-results headline = **"Geen
treffers."** (LOCKED 8s4.1) — *treffer* is both the Dutch word for a search hit
and a football goal; genuine double meaning, grown-up. Rejected: "Niets in de
netten." (folksier), "Buiten bereik." (loses the football wink), plain "Niets
gevonden." (kept only as the fallback if the wink ever feels off). The 404/500
voice (round 8e) should rhyme with this register.

The JerseyShirt artefact stays (owner objected only to the copy, not the
furniture); render it modest, not dominant.

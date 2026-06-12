# 8e2 — 404/500 copy + actions · LOCKED

Layout (A vs C) is still a Storybook A/B (see 8e1). Copy below is
layout-independent and renders in the Storybook prototype.

## 404 — not found

- **Code line** (mono): `Fout 404 · pagina niet gevonden`
- **Headline:** **"Buiten de lijnen."** — accent on "lijnen" (jersey-deep on
  cream / warm on dark). Out of bounds = the page is off the pitch. Owner did not
  object to the recommended line; revisitable at the Storybook review.
- **Body:** `Deze pagina staat niet (meer) op het veld. Misschien is de link
  verplaatst of bestaat ze niet meer.`
- **Actions (two):**
  1. `Naar de homepage` (primary, jersey) → `/`
  2. **`Zoeken`** (secondary, ghost) → `/zoeken` — owner add: give a lost visitor
     a way to *search* instead of only bouncing home. Keep this as the **single**
     search affordance in the action row — do not also surface it inline in the
     body (avoids a duplicate search affordance).

## 500 — server error

- **Code line** (mono): `Fout 500 · er ging iets mis`
- **Headline:** **"Technische panne."** — accent on "panne". A breakdown on our
  side; grown-up, pairs with the 404 voice.
- **Body:** `Er ging iets mis aan onze kant. Probeer het zo dadelijk opnieuw.`
- **Actions (two):**
  1. `Probeer opnieuw` (primary) → wired to the `reset()` callback from
     `error.tsx` (must stay functional).
  2. `Naar de homepage` (ghost) → `/`

## Notes

- Both pages now carry **two actions** → the shared `<ErrorState>` always renders
  an action pair; clean for the component API.
- Buttons stay plain/clear — the wink is in the headline only (memory: owner
  rejected childish copy; "Geen treffers" register).
- The `/zoeken` secondary on 404 is the only asymmetry vs 500 (which has reset +
  home). Both fit a two-button row.

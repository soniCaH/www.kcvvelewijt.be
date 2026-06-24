# ART-3 — Event-fact hero strip (contained redesign)

**Issue:** #2237 (ART-3) · go-live-ux-polish
**Mockup:** `compare.html`
**Target:** `apps/web/src/components/article/blocks/EventDetailBlock/EventDetailBlock.tsx` — the hoisted **first-eventFact hero strip** between the article hero and body on `articleType=event`. Today it's full-bleed, edge-to-edge, no container, visually weak.
**Out of scope:** the in-body inline `EventFactInline` polaroid (already locked — see `phase-5-article-detail/eventfact-inline-locked.md`).

Each variant is shown in article context (event hero → panel → body prose) and is contained to the wide container (~1040px) — killing the full-bleed is the core fix. All compose from existing primitives (sharp corners, jersey-deep, cream/ink, CTAs "Reserveer" + "Zet in agenda").

| Variant                     | Single choice isolated                                                   | Source primitives               |
| --------------------------- | ------------------------------------------------------------------------ | ------------------------------- |
| **A** Ticket-stub panel     | perforated stub + big ink date block left, mono venue/time rows          | TicketStub, MonoLabel           |
| **B** Taped index-card      | TapedCard + one washi TapeStrip + 3-col fact grid (Locatie/Datum/Tijd)   | TapedCard, TapeStrip, MonoLabel |
| **C** Boarding-pass band    | contained jersey-deep band, large date numeral, perforated "Reserveer →" | TicketStub, jersey-deep band    |
| **D** Seam-framed factsheet | StripedSeam top+bottom frame + restrained MonoLabelRow (quietest)        | StripedSeam, MonoLabelRow       |

Past-event treatment (muted "Afgelopen" pill, CTA hidden) shown under D.

**Recommendation:** **B (Taped index-card)** — reuses the most locked vocabulary, the 3-column MonoLabel grid scans fastest for Locatie/Datum/Tijd, and reads as "event" without the heavier jersey-band weight of C. Awaiting owner pick.

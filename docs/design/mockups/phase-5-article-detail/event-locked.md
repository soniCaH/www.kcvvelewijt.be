# Event variant body — locked (drill 5.d-evt)

**Drill:** 5.d-evt · Round 1 · #1790
**Locked:** 2026-05-18 by @climacon
**Mockups:** `5d-evt/round-1-event-detail-comparisons.html`

---

## Scope reminder

This drill is **body-only**. The event hero (typographic kicker + title) and the locked EventStrip below the hero (compressed date-block + title + small CTA) are Phase 3-b R1.5 (#1749) and untouched by this drill. The drill resolves the **full event detail card** that lives in the body beyond the strip.

## Decision (placement)

**Option A — `<EventDetailBlock>` after `<EndMark>`, before `<VerderLezenRow>`.** Full detail block at article end. Reader finishes the prose, sees the closing star, then gets the full event card with sessions schedule + address + capacity + note + large re-engagement CTA.

```text
<EditorialHero variant="event" placement="detail" />      ← Phase 3-b R1.5
<EventStrip>                                              ← Phase 3-b R1.5 (compressed)
<DropCapParagraph>                                        ← Phase 1
<PortableText body />                                     ← editor's prose
<PullQuote interspersed />                                ← Phase 1
<EndMark flourish="star" />                               ← Phase 1
<EventDetailBlock />                                      ← THIS DRILL · net-new
<ArticleCredits />                                        ← 5.d-int B
<VerderLezenRow />                                        ← 5.A.2
```

## Decision (past-event behaviour)

**Badge in card head, CTA hidden.** When the event has passed (`endDate < today`, or `date < today` if no endDate), the EventDetailBlock:

- Replaces the head's **tag pill** (driven by `competitionTag` for upcoming events) with a muted **`Afgelopen`** pill in the same slot. Same vocabulary as the upcoming-event tag pill — different label.
- **Hides the CTA button** entirely (no `Bestel je tafel` link rendered).
- **Keeps sessions / location / address / capacity / note visible** — the card becomes a historical record of what the event was. The article body around it remains as written.

```text
[ Afgelopen ]                ← muted pill replacing the original tag
Steakfestijn 2026
SEP 25 · VR–ZO

VR · 25  Vrijdag  18:00 – 22:00
ZA · 26  Zaterdag 17:00 – 23:00
ZO · 27  Zondag   11:30 – 15:00

Locatie     Sportpark Elewijt
Adres       Driesstraat 14, Elewijt
Capaciteit  Max 250 plaatsen

"Drie dagen feest, twee dagen vlees, één goede zaak."

(no CTA button rendered)
```

## Rationale

### Placement (A)

- **Doesn't compete with the hero EventStrip** — strip carries quick-glance meta; body block carries committed detail. The reader has already engaged with the prose by the time they reach the block.
- **Editor controls placement implicitly** — `<EventDetailBlock>` is always at article end. No editor decision required (Option C made the editor's first h2 surprise them; Option D forced a structural body-width delta).
- **No JS scroll-listening behavior** — Option B's sticky CTA bar required new platform behavior and dropped sessions / address entirely. Multi-day events with `sessions[]` need somewhere to render the schedule.
- **Symmetric with `<ArticleCredits>` placement** — both are end-of-body blocks in the locked composition. EventDetailBlock sits between EndMark and ArticleCredits.

### Past-event treatment (badge)

- **Preserves informational value** — sessions / address / location / note stay readable. Useful for "when did this happen?" / "who was the venue?" lookups months later.
- **Removes the action affordance cleanly** — no CTA, no dead link, no "register for a past event" failure mode.
- **Visually minimal** — same card layout, just different head pill. No greying (which reads as broken), no diagonal stamp (which reads as decorative).
- **Editor doesn't have to do anything** — date-based, fully automatic.

## EventDetailBlock composition (locked)

- **Container:** prose-width card (`--container-prose: 680px`), white background, 2px ink border, hard offset shadow, single jersey-tape strip on top.
- **Head:** date-block (month / day / weekday) on the left + tag pill + title on the right; separated from body by a dotted ink-muted divider.
- **Sessions block** (when `sessions[]` is populated): 3-column mono-caps grid (`day-key` / `day-val` italic serif / `day-hours` mono). Skipped entirely when no sessions (simple events use `date` + `startTime`/`endTime` rendered as a single row).
- **Meta block** (`<dl>` definition list): Locatie / Adres / Capaciteit rows, mono caps key + italic serif value. Each row drops when its source field is blank.
- **Note** (when `note` PortableText is populated): italic serif, ink-soft, prose-like.
- **CTA** (when `ticketUrl` is set AND event is upcoming): jersey-deep button with `ticketLabel` text (defaults to "Inschrijven"). Hidden for past events.

Past-event Boolean is computed at the page-level Server Component using a simple date comparison; passed to `<EventDetailBlock>` as an `isPast: boolean` prop so the renderer stays pure.

## When NOT to render the block

The lock applies to event articles with **at least one of**:

- `sessions[]` populated (multi-day or per-day schedule)
- `address` populated (venue address detail beyond what the strip shows)
- `capacity` populated
- `note` populated

For minimal events with only `date` + `startTime`+`endTime` + `location` (already covered by the strip), the renderer **may skip** `<EventDetailBlock>` entirely — body is just prose + EndMark + VerderLezenRow. Decision per article based on whether the additional fields exist; not an editor toggle.

## What this drill resolves

- ✅ Body placement of `<EventDetailBlock>` — Option A (after EndMark).
- ✅ Past-event behaviour — Badge ("Afgelopen") replacing the kicker tag; CTA hidden; rest of card visible.
- ✅ Skip-condition rule — block only renders when sessions / address / capacity / note add value beyond the strip.
- ✅ No new schema fields, no fabricated data — uses existing `eventFact` shape.

## What this drill does NOT decide

- **Hero / EventStrip composition** — locked at Phase 3-b R1.5 (typographic hero + EventStrip). Unchanged.
- **Multi-eventFact articles** — when `body[]` contains multiple eventFact blocks, the first powers the hero strip; the schema's "subsequent eventFacts render as compact overview rows" promise lives in `body[]` PT renderer. Treatment of those overview rows mirrors the 5.d-tra adjacency rule for transferFact (compact TapedCards in body[] flow). Reuse 5.d-tra precedent; doesn't need its own drill.
- **Maps embedding** — `address` is a string field today; no lat/lon. If editorial wants an inline map widget, that's a follow-up with schema + integration scope.
- **Calendar export** — "Add to calendar" link or .ics download is a follow-up; not in the current scope.

## Net new primitives / schema

- **Schema:** none (uses existing `eventFact` fields).
- **Component:** `<EventDetailBlock>` (new) — composes from existing typography + the date-block primitive used by the locked EventStrip + 2px ink border + tape strip. Storybook stories for upcoming / past-event / sessions / no-sessions / minimal (single-day) variants.
- **`isPast` prop:** boolean computed page-level; clean derivation from `eventFact.endDate ?? eventFact.date < today`.

## Downstream

- **#1798 (5.B.evt)** — consumes this lock when implementing `<EventDetailBlock>`. Title already reads "EventDetailBlock"; ACs need the past-event badge rule + skip-condition rule + sessions block + meta `<dl>` shape folded in during `/spec` pass.

## Source-of-truth

- Mockup HTML: `docs/design/mockups/phase-5-article-detail/5d-evt/round-1-event-detail-comparisons.html`
- Phase 3-b event hero lock: `docs/design/mockups/phase-3-b-editorial-hero/event-locked.md`
- 5.d-tra transferFact body precedent (TapedCard in body PT flow): `docs/design/mockups/phase-5-article-detail/transfer-locked.md`
- Memories consumed: `feedback_design_data_audit`, `feedback_reuse_approved_primitives`, `feedback_no_bright_jersey`.

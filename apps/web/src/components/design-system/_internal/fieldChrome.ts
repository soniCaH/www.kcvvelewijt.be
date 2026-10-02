/**
 * Shared field-chrome class strings for the Phase 2.A.4 form-atom state
 * machine — Direction C "paper-card emphasis" (PRD §6.3,
 * `docs/design/mockups/phase-2-a-4-form-atoms/compare.md`), re-skinned by
 * #3337: every typed-value field rests on cream with a full-ink border and
 * the ink paper shadow (`docs/design/mockups/3307-field-skin/`).
 *
 * Eight-state machine, uniform across `<Input>`, `<Select>`, `<Textarea>`:
 *
 * | State        | Border       | Shadow                            | Transform             | Ring                   |
 * | ------------ | ------------ | --------------------------------- | --------------------- | ---------------------- |
 * | Default      | 2px ink      | --shadow-paper-sm (4×4)           | —                     | —                      |
 * | Hover        | 2px ink      | --shadow-paper-sm-hover (3×3)     | translate(1px, 1px)   | —                      |
 * | Focus        | 2px ink      | 0 0 0 0                           | translate(2px, 2px)   | global focus ring      |
 * | Filled       | 2px ink      | --shadow-paper-sm                 | —                     | —                      |
 * | Filled+focus | 2px ink      | 0 0 0 0                           | translate(2px, 2px)   | global focus ring      |
 * | Error        | 2px alert    | --shadow-paper-sm-alert (4×4)     | —                     | —                      |
 * | Error+focus  | 2px alert    | 0 0 0 0                           | translate(2px, 2px)   | jersey-deep (always)   |
 * | Disabled     | 2px ink/15   | --shadow-paper-sm-soft (inherits  | —                     | —                      |
 * |              |              |  field opacity-50)                |                       |                        |
 *
 * The ring is the site-wide one from `globals.css` (`:focus-visible`, 2px at
 * a 2px offset) — no field class draws it. An error field pins it to
 * jersey-deep (`[--focus-ring:...]` on the error chrome): green says "you are here", red (border and
 * shadow) says "something is wrong", one job per colour.
 *
 * Rest is already full ink, so the border no longer climbs through the
 * states: hover and filled read as ink too, and the shadow (compression on
 * hover, collapse on focus) carries the state alone. Disabled keeps its own
 * muted skin — the grey soft shadow, not the ink one.
 *
 * The chrome strings below cover every state EXCEPT padding/text-size,
 * which each atom owns (Input/Select pad inline, Textarea pads block).
 *
 * Token contract: never inline shadow values. The shadow tokens
 * (`--shadow-paper-sm`, `-sm-hover`, `-sm-soft`,
 * `-sm-alert`, `-sm-alert-hover`) are the single source of truth for the
 * paper-press state machine.
 */

/** Default-state chrome (rest, hover, focus, filled, disabled). */
const fieldChromeIdle = [
  // Base — sharp corners, cream surface, transitions
  "font-body w-full border-2 bg-cream transition-[transform,box-shadow,border-color,background-color,opacity] duration-150",
  "text-ink placeholder:text-ink/40",

  // Idle border + shadow — full ink; filled (typed, not focused) needs no
  // rule of its own because rest is already at the end of the old border
  // progression.
  "border-ink shadow-[var(--shadow-paper-sm)]",

  // Hover — compress shadow + nudge surface
  "hover:shadow-[var(--shadow-paper-sm-hover)] hover:translate-x-px hover:translate-y-px",

  // Focus — full ink border, snap shadow off, press into paper
  "focus:border-ink focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5",

  // VR determinism (#3033 pattern, shared across Input/Textarea/Select —
  // see field-vr-focus.ts): Chromium only paints `:focus` when the frame
  // rendering the page itself holds real OS/window focus, not merely when
  // `document.activeElement` is set inside it. An `autoFocus` story's
  // "Focused" capture races that real frame focus — exposed once
  // `waitForPageReadyCapped` (#3137) stopped adding the extra settle time a
  // live, uncached font fetch used to cost the first (mobile) viewport
  // shot. `data-vr-force-ring` is never set by these components themselves;
  // a story's `play` function sets it on the rendered field directly for
  // VR-tagged "Focused" stories only, painting the exact same focus chrome
  // from state the story declares instead of one dependent on the runner's
  // frame focus. A real visitor's `focus:` behaviour is untouched.
  "data-[vr-force-ring=true]:border-ink data-[vr-force-ring=true]:shadow-none data-[vr-force-ring=true]:translate-x-0.5 data-[vr-force-ring=true]:translate-y-0.5",

  // Disabled — its own skin: ink/15 border, cream-soft surface, the grey
  // soft shadow (so a frozen field never reads as the live ink-shadowed
  // one), opacity-50. Frozen at rest inside the paper vocabulary instead
  // of `shadow-none`, which lifts the field out of the system entirely.
  "disabled:bg-cream-soft disabled:border-ink/15 disabled:shadow-[var(--shadow-paper-sm-soft)] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[var(--shadow-paper-sm-soft)]",
].join(" ");

/** Error-state chrome — replaces idle when `error` prop is set. */
const fieldChromeError = [
  // Base — same cream surface as idle; only border + shadow turn alert
  // (`[--focus-ring:…]`: the ring stays jersey-deep whatever ground the field
  // sits on — the state, not the ground, decides here)
  "font-body w-full border-2 bg-cream transition-[transform,box-shadow,border-color,background-color,opacity] duration-150 [--focus-ring:var(--color-jersey-deep)]",
  "text-ink placeholder:text-ink/40",

  // Border + shadow tinted with alert
  "border-alert shadow-[var(--shadow-paper-sm-alert)]",

  // Hover — compress alert shadow + nudge
  "hover:shadow-[var(--shadow-paper-sm-alert-hover)] hover:translate-x-px hover:translate-y-px",

  // Focus — alert border stays, press into paper
  "focus:border-alert focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5",

  // VR determinism (#3033 pattern) — see the matching rule in
  // fieldChromeIdle above for the full rationale.
  "data-[vr-force-ring=true]:border-alert data-[vr-force-ring=true]:shadow-none data-[vr-force-ring=true]:translate-x-0.5 data-[vr-force-ring=true]:translate-y-0.5",

  // Disabled — same vocabulary as the idle disabled state. The alert
  // shadow stays since the field is still semantically "in error", just
  // frozen (hover included); opacity-50 softens it visually.
  "disabled:bg-cream-soft disabled:border-ink/15 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[var(--shadow-paper-sm-alert)]",
].join(" ");

/** Selects the chrome string for a given error state. */
export function fieldChrome(error: boolean): string {
  return error ? fieldChromeError : fieldChromeIdle;
}

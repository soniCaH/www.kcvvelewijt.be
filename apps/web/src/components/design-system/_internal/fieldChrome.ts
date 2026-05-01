/**
 * Shared field-chrome class strings for the Phase 2.A.4 form-atom state
 * machine — Direction C "paper-card emphasis" (PRD §6.3,
 * `docs/design/mockups/phase-2-a-4-form-atoms/compare.md`).
 *
 * Eight-state machine, uniform across `<Input>`, `<Select>`, `<Textarea>`:
 *
 * | State        | Border       | Shadow                            | Transform             |
 * | ------------ | ------------ | --------------------------------- | --------------------- |
 * | Default      | 2px ink/30   | --shadow-paper-sm-soft (4×4)      | —                     |
 * | Hover        | 2px ink/40   | --shadow-paper-sm-soft-hover (3×3)| translate(1px, 1px)   |
 * | Focus        | 2px ink      | 0 0 0 0                           | translate(2px, 2px)   |
 * | Filled       | 2px ink/60   | --shadow-paper-sm-soft            | —                     |
 * | Filled+focus | 2px ink      | 0 0 0 0                           | translate(2px, 2px)   |
 * | Error        | 2px alert    | --shadow-paper-sm-alert (4×4)     | —                     |
 * | Error+focus  | 2px alert    | 0 0 0 0                           | translate(2px, 2px)   |
 * | Disabled     | 2px ink/15   | --shadow-paper-sm-soft (inherits  | —                     |
 * |              |              |  field opacity-50)                |                       |
 *
 * Filled is selected via `:not(:placeholder-shown):not(:focus)` — this
 * makes the filled-anchor automatic without consumers needing to wire a
 * `data-filled` attribute. For `<Select>`, the same selector works
 * because a placeholder option (disabled value="") triggers
 * `:placeholder-shown` semantics in Chromium / Safari; we add a JS
 * fallback class only if needed (not currently required — native
 * placeholder-shown matching is sufficient on the supported browsers).
 *
 * The chrome strings below cover every state EXCEPT padding/text-size,
 * which each atom owns (Input/Select pad inline, Textarea pads block).
 *
 * Token contract: never inline shadow values. The four shadow tokens
 * (`--shadow-paper-sm-soft`, `-soft-hover`, `-alert`, `-alert-hover`)
 * are the single source of truth for the paper-press state machine.
 */

/** Default-state chrome (rest, hover, focus, filled, disabled). */
export const fieldChromeIdle = [
  // Base — sharp corners, white surface, transitions
  "font-body w-full border-2 bg-white transition-all duration-150 focus:outline-hidden",
  "text-ink placeholder:text-ink/40",

  // Idle border — ink/30
  "border-ink/30",

  // Idle shadow — paper-soft
  "shadow-[var(--shadow-paper-sm-soft)]",

  // Hover — compress shadow + nudge surface, deepen border
  "hover:border-ink/40 hover:shadow-[var(--shadow-paper-sm-soft-hover)] hover:translate-x-px hover:translate-y-px",

  // Filled (text typed but not focused) — anchor at ink/60
  "[&:not(:placeholder-shown):not(:focus)]:border-ink/60",

  // Focus — full ink border, snap shadow off, press into paper
  "focus:border-ink focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5",

  // Disabled — drop borders to ink/15 + cream surface + opacity-50 inherits
  // through to the resting paper-soft shadow, so disabled reads as "frozen
  // at rest" inside the same paper vocabulary as the other states (instead
  // of `shadow-none`, which lifts the field out of the system entirely).
  "disabled:bg-cream-soft disabled:border-ink/15 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[var(--shadow-paper-sm-soft)]",
].join(" ");

/** Error-state chrome — replaces idle when `error` prop is set. */
export const fieldChromeError = [
  // Base
  "font-body w-full border-2 bg-white transition-all duration-150 focus:outline-hidden",
  "text-ink placeholder:text-ink/40",

  // Border + shadow tinted with alert
  "border-alert shadow-[var(--shadow-paper-sm-alert)]",

  // Hover — compress alert shadow + nudge
  "hover:shadow-[var(--shadow-paper-sm-alert-hover)] hover:translate-x-px hover:translate-y-px",

  // Focus — alert border stays, press into paper
  "focus:border-alert focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5",

  // Disabled — same vocabulary as the idle disabled state. The alert
  // shadow stays since the field is still semantically "in error", just
  // frozen; opacity-50 softens it visually.
  "disabled:bg-cream-soft disabled:border-ink/15 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0",
].join(" ");

/** Selects the chrome string for a given error state. */
export function fieldChrome(error: boolean): string {
  return error ? fieldChromeError : fieldChromeIdle;
}

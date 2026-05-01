/**
 * TextareaCounter — `current/max` mono digits rendered inside the bottom-
 * right corner of a `<Textarea>` field. Phase 2.A.4 form-atom primitive.
 *
 * Color shifts to `text-alert` when `current > max` so the over-limit
 * state is legible without a separate error message — the textarea border
 * still flips to alert via its own `error` prop when the parent form
 * decides the field is invalid. The counter alone does not toggle the
 * field's error chrome (parent controls that contract).
 *
 * The semi-transparent cream background lifts the digits off the textarea
 * fill so they remain readable when text wraps underneath.
 */

import { cn } from "@/lib/utils/cn";

export interface TextareaCounterProps {
  /** Current character count. */
  current: number;
  /** Maximum allowed character count. */
  max: number;
  /** Additional classes appended to the wrapper. */
  className?: string;
}

export function TextareaCounter({
  current,
  max,
  className,
}: TextareaCounterProps) {
  const over = current > max;
  return (
    <span
      aria-hidden="true"
      data-over={over || undefined}
      className={cn(
        "pointer-events-none absolute right-3.5 bottom-2 px-1 py-px",
        "bg-cream/85 font-mono text-[11px] leading-none tabular-nums",
        over ? "text-alert" : "text-ink/60",
        className,
      )}
    >
      {current}/{max}
    </span>
  );
}

TextareaCounter.displayName = "TextareaCounter";

"use client";

import { cn } from "@/lib/utils/cn";

export type RemovableChipTone = "ink" | "outline";

export interface RemovableChipProps {
  /** Visible token label. */
  label: string;
  /** Fired when the remove (×) control is pressed. */
  onRemove: () => void;
  /**
   * Accessible verb prefixed to the label on the remove control
   * (`"{removeLabel} {label}"`). Default `"Verwijder"` — the × glyph itself is
   * `aria-hidden`, so the button always has a meaningful name.
   */
  removeLabel?: string;
  /** `ink` (default) = ink-filled token; `outline` = cream token, ink border. */
  tone?: RemovableChipTone;
  className?: string;
}

const TONE_CLASS: Record<RemovableChipTone, string> = {
  ink: "border-ink bg-ink text-cream",
  outline: "border-ink bg-cream text-ink",
};

/**
 * A selected-value token with a remove (×) control — the "chip with a cross"
 * pattern (team selections, search filters, tag pickers). Paper/ink, mono.
 * Use this for removing ONE item from a multi-selection. A single
 * clear-the-whole-field "×" on a search input is a *different* idiom (see the
 * organigram search bars) and is NOT a RemovableChip.
 */
export function RemovableChip({
  label,
  onRemove,
  removeLabel = "Verwijder",
  tone = "ink",
  className,
}: RemovableChipProps) {
  return (
    <span
      data-testid="removable-chip"
      className={cn(
        "inline-flex items-center gap-1.5 border-2 px-2.5 py-1 font-mono text-[11px] font-semibold",
        TONE_CLASS[tone],
        className,
      )}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${removeLabel} ${label.trim() || "selectie"}`}
        className="focus-visible:outline-jersey-deep flex h-4 w-4 items-center justify-center text-sm leading-none transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span aria-hidden="true">×</span>
      </button>
    </span>
  );
}

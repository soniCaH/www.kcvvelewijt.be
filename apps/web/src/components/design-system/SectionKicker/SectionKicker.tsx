import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { MonoLabel } from "../MonoLabel";

export interface SectionKickerProps {
  /** The kicker label (mono, uppercased by `<MonoLabel>`). */
  children: ReactNode;
  /** Layout / margin overrides applied to the row wrapper. */
  className?: string;
}

/**
 * <SectionKicker> — a mono section label followed by a trailing paper-edge
 * hairline rule (`KICKER ─────`). The redesign's standard section header for
 * landing-page sub-sections (filosofie/visie, the jeugd nav hub). Extracted
 * from the byte-identical inline pattern that lived in `<JeugdVisie>` and
 * `<SponsorTiers>` — which has since moved to the run-label heading
 * (`<RunLabel>`, #3334): a card-run label is not a section kicker.
 */
export function SectionKicker({ children, className }: SectionKickerProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <MonoLabel variant="plain">{children}</MonoLabel>
      <span aria-hidden="true" className="bg-paper-edge h-0.5 flex-1" />
    </div>
  );
}

/**
 * FieldHint — the helper line under a form atom.
 *
 * One implementation shared by `<Input>`, `<Select>` and `<Textarea>`, which
 * carried three byte-identical copies of it before D4 gave the hint its
 * bracket (`docs/research/decision-sheet.md` §8, unit 10 of #2608).
 *
 * The line opens with the mono `[?]` and no icon — see the "no invented
 * glyph" rule in `BracketAffordance.tsx`. The field's error line is the one
 * that does carry an icon, and that is `<AlertBadge>`'s, which the bracket
 * must not touch.
 *
 * This `<p>` is the field's `aria-describedby` target, so the hint text
 * stays a direct text-node child of it — that keeps the description the
 * sentence alone, and is what the atoms' `getByText("…")` tests read.
 */

import type { ReactNode } from "react";
import { BracketAffordance } from "@/components/design-system/BracketAffordance";

export interface FieldHintProps {
  /** Id the field points at with `aria-describedby`. */
  id: string;
  /** Hint sentence — the whole of the accessible description. */
  children: ReactNode;
}

export const FieldHint = ({ id, children }: FieldHintProps) => {
  return (
    <p id={id} className="font-body text-ink/60 mt-2 text-sm italic">
      <BracketAffordance glyph="help" className="mr-1.5" />
      {children}
    </p>
  );
};

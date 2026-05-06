/**
 * <EditorialKicker> — leading-and-trailing ★ glyphs sandwiching a
 * dot-separated `<MonoLabelRow>` of editorial chrome (article type,
 * date, read time, etc.).
 *
 * Composition: `★ KICKER · ITEM · ITEM · … ★` — stars at the ends,
 * dots between items. The "sandwich" framing puts the star accent only
 * on the bread (outside), leaving the row internals quiet.
 *
 * Spec: PRD redesign-phase-3 §5.B.1 ("star sandwich + dot-separated
 * MonoLabel row"). An earlier draft of the issue body said
 * `divider="★"` which produced visually mismatched stars at different
 * sizes; the dot-separator reading from the PRD is the correct one.
 */
import { MonoStar } from "../MonoStar/MonoStar";
import {
  MonoLabelRow,
  type MonoLabelRowItem,
} from "../MonoLabelRow/MonoLabelRow";

export interface EditorialKickerProps {
  /** Items rendered between the leading and trailing ★ glyphs. */
  items: MonoLabelRowItem[];
}

export function EditorialKicker({ items }: EditorialKickerProps) {
  if (items.length === 0) return null;
  return (
    <div className="text-ink-muted flex items-center gap-2 font-mono leading-none">
      <MonoStar />
      <MonoLabelRow items={items} />
      <MonoStar />
    </div>
  );
}

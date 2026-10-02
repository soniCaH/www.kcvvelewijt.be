import Link from "next/link";
import { LinkPendingDots } from "@/components/design-system/LinkPendingDots";

import { cn } from "@/lib/utils/cn";

export interface LeaderDotRowProps {
  /** Left-hand text — what the thing is called. Truncates before the leader does. */
  label: string;
  /**
   * Right-hand value the label is paired with. `null`, `undefined` and `""` all
   * count as absent and render an em dash rather than collapsing the pair to a
   * bare label.
   */
  value?: string | null;
  /** Optional destination — the whole row becomes one link when set. */
  href?: string;
  className?: string;
}

/**
 * `label · · · · · value` — the printed contents-page row (#2622, decision D11
 * · S5 in `docs/research/decision-sheet.md`).
 *
 * A flex row with a dotted rule expanding between the label and its value, so
 * the eye tracks from one to the other without a rule separating every row.
 * Built as a primitive rather than inline on `/inhoud` because the same device
 * is wanted on `/kalender` entries, the article "in dit stuk" list and the
 * footer link columns — none of which are in scope here, but none of which
 * should have to rewrite it.
 *
 * **The filler is `aria-hidden`.** That is the whole reason this is a component
 * and not three spans copy-pasted: a screen reader announcing a run of dots
 * between every label and every value is the failure mode the decision names.
 * The accessible name of a linked row is therefore exactly `label value`.
 *
 * **One root element, always** — a `<div>`, or the `<Link>` itself when `href`
 * is set. A list consumer supplies its own `<li>` around it, which it wants
 * anyway for spacing or for the markers a delegated click listener reads.
 *
 * Sizing follows the row, not the primitive: `label` inherits the consumer's
 * type, the value is mono at the 11px label step so a column of values aligns
 * (the Typekit faces have no `tnum`, so a numeric column goes mono or it does
 * not line up).
 */
export function LeaderDotRow({
  label,
  value,
  href,
  className,
}: LeaderDotRowProps) {
  const contents = (
    <>
      <span className="min-w-0 truncate">{label}</span>
      {/* The leader. Hidden from assistive tech — see the docblock. `mb-1`
          drops the rule just under the shared baseline, which is what makes it
          read as a leader rather than a strikethrough. */}
      <span
        aria-hidden="true"
        data-leader-fill="true"
        className="border-ink-muted mx-1.5 mb-1 h-0 min-w-3 flex-1 border-b border-dotted"
      />
      {value ? (
        <span className="text-ink-muted text-label shrink-0 font-mono whitespace-nowrap">
          {value}
        </span>
      ) : (
        // An absent value is *visibly* absent: the reader sees that this row
        // has none, instead of the pair silently collapsing to a label. Hidden
        // from assistive tech because read aloud the absence is already carried
        // by there being nothing after the label — a spoken "em dash" is noise.
        <span
          aria-hidden="true"
          data-value-absent="true"
          className="text-ink-muted text-label shrink-0 font-mono"
        >
          —
        </span>
      )}
    </>
  );

  const rowClass = "flex items-baseline";

  if (!href) {
    return <div className={cn(rowClass, className)}>{contents}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        rowClass,
        "text-ink hover:text-jersey-deep focus-visible:text-jersey-deep transition-colors duration-150",
        className,
      )}
    >
      {contents}
      <LinkPendingDots />
    </Link>
  );
}

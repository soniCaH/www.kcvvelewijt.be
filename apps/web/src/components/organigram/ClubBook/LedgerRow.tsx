"use client";

import { cn } from "@/lib/utils/cn";
import { LeaderFill } from "@/components/design-system";
import { useOrganigramAnalytics } from "@/hooks/useOrganigramAnalytics";
import { joinNames, type LedgerRow as LedgerRowVM } from "./club-book";
import { HolderCard } from "./HolderCard";
import { VacantLink } from "./Vacant";

const ROW_LINE = "flex items-baseline py-2 print:py-0";
const TITLE = "text-body-md text-ink print:text-body-sm min-w-0";

/**
 * A vacant box: `box title ······ plek vrij — iets voor jou?`, the invitation
 * being a link to the contact page. There is nothing to unfold, so it is a plain
 * row, not a `<details>`: a link inside a summary is nested interactive content
 * that screen readers cannot reach reliably. `openStructureRow` finds it through
 * the same marker a key-figure card carries.
 */
function VacantRow({ row }: { row: LedgerRowVM }) {
  return (
    <li data-key-node-id={row.id} tabIndex={-1} className="break-inside-avoid">
      <span className={ROW_LINE}>
        <span className={TITLE}>{row.titles.join(" · ")}</span>
        <LeaderFill />
        <VacantLink className="print:text-body-sm shrink-0" />
      </span>
    </li>
  );
}

function HeldRow({ row }: { row: LedgerRowVM }) {
  const { trackMemberClicked } = useOrganigramAnalytics();

  return (
    <li className="break-inside-avoid">
      <details
        className="group"
        data-node-ids={row.nodeIds.join(" ")}
        onToggle={(event) => {
          const el = event.currentTarget;
          if (!el.open) return;
          // `openStructureRow` says where the open came from; a click is "cards".
          const view = el.dataset.openView === "chart" ? "chart" : "cards";
          delete el.dataset.openView;
          trackMemberClicked({ members: row.holders }, view);
        }}
      >
        <summary className="hover:text-jersey-deep cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span className={cn("group-open:text-jersey-deep", ROW_LINE)}>
            <span className={TITLE}>{row.titles.join(" · ")}</span>
            <LeaderFill />
            <span
              className={cn(
                "text-body-md text-ink print:text-body-sm min-w-0 text-right font-semibold break-words hyphens-auto",
                // On paper one or two names stay on one line; the title wraps instead.
                row.holders.length < 3 && "print:whitespace-nowrap",
              )}
            >
              {joinNames(row.holders)}
            </span>
            <span
              aria-hidden="true"
              className="text-ink-muted text-mono-sm ml-2 shrink-0 font-mono group-open:rotate-45 print:hidden"
            >
              +
            </span>
          </span>
        </summary>
        <div className="mb-3 flex flex-col gap-3 print:hidden">
          {row.holders.map((holder) => (
            <HolderCard key={holder.id} holder={holder} />
          ))}
        </div>
      </details>
    </li>
  );
}

/**
 * One ledger line: `box title ······ name(s)  +`. The dotted leader already
 * ties the job to the name, so rows carry no separator. A native `<details>`
 * unfolds the holders' cards in place — keyboard (Enter/Space) and the open
 * state for assistive tech come with the element.
 *
 * `toggle` is where a row opening is counted, so a click, the finder's
 * "Toon in structuur →", a search hit and a `?member=` link all fire the same
 * member event (`openStructureRow` only flips `open`). A key-figure card or a
 * vacant row has nothing to toggle; `openStructureRow` fires its event itself.
 */
export function LedgerRow({ row }: { row: LedgerRowVM }) {
  return row.holders.length === 0 ? (
    <VacantRow row={row} />
  ) : (
    <HeldRow row={row} />
  );
}

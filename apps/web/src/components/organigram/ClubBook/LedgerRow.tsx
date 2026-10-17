"use client";

import Link from "next/link";
import { LeaderFill } from "@/components/design-system";
import { useOrganigramAnalytics } from "@/hooks/useOrganigramAnalytics";
import { joinNames, type LedgerRow as LedgerRowVM } from "./club-book";
import { HolderCard } from "./HolderCard";
import { CONTACT_HREF, VACANT_LABEL } from "./Vacant";

/**
 * One ledger line: `box title ······ name(s)  +`. The dotted leader already
 * ties the job to the name, so rows carry no separator. A native `<details>`
 * unfolds the holders' cards in place — keyboard (Enter/Space) and the open
 * state for assistive tech come with the element.
 *
 * `toggle` is where a row opening is counted, so a click, the finder's
 * "Toon in structuur →", a search hit and a `?member=` link all fire the same
 * member event (`openStructureRow` only flips `open`). A key-figure card has
 * nothing to toggle; `openStructureRow` fires its event itself.
 */
export function LedgerRow({ row }: { row: LedgerRowVM }) {
  const { trackMemberClicked } = useOrganigramAnalytics();
  const vacant = row.holders.length === 0;

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
          <span className="group-open:text-jersey-deep flex items-baseline py-2 print:py-0.5">
            <span className="text-body-md text-ink print:text-body-sm min-w-0">
              {row.titles.join(" · ")}
            </span>
            <LeaderFill />
            {vacant ? (
              <span className="text-ink-muted text-body-sm shrink-0 italic">
                {VACANT_LABEL}
              </span>
            ) : (
              <span className="text-body-md text-ink min-w-0 text-right font-semibold break-words hyphens-auto">
                {joinNames(row.holders)}
              </span>
            )}
            <span
              aria-hidden="true"
              className="text-ink-muted text-mono-sm ml-2 shrink-0 font-mono group-open:rotate-45 print:hidden"
            >
              +
            </span>
          </span>
        </summary>
        <div className="mb-3 flex flex-col gap-3 print:hidden">
          {vacant ? (
            <p className="text-body-sm text-ink">
              Deze plek is vrij.{" "}
              <Link href={CONTACT_HREF} className="prose-link">
                Iets voor jou? Laat het ons weten
              </Link>
            </p>
          ) : (
            row.holders.map((holder) => (
              <HolderCard key={holder.id} holder={holder} />
            ))
          )}
        </div>
      </details>
    </li>
  );
}

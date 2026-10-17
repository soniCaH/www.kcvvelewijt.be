import Link from "next/link";
import { RoundAvatar } from "@/components/design-system";
import type { KeyFigure, KeyGroup } from "./club-book";
import { MemberContact, MemberName } from "./MemberContact";

const VACANT_LINK = "text-jersey-deep text-body-sm font-semibold underline";

function KeyFigureCard({ figure }: { figure: KeyFigure }) {
  return (
    <li
      data-key-node-id={figure.nodeId}
      tabIndex={-1}
      className="border-ink bg-cream-soft shadow-paper-sm break-inside-avoid border p-4 print:p-3"
    >
      <h4 className="text-label text-jersey-deep font-mono uppercase">
        {figure.title}
      </h4>
      {figure.why && (
        <p className="text-body-sm text-ink-muted mt-1">{figure.why}</p>
      )}
      {figure.holders.length === 0 ? (
        <Link href="/club/contact" className={`${VACANT_LINK} mt-3 block`}>
          plek vrij — iets voor jou?
        </Link>
      ) : (
        <ul className="mt-4 flex flex-col gap-4 print:mt-2 print:gap-2">
          {figure.holders.map((holder) => (
            <li key={holder.id} className="flex items-start gap-3">
              <RoundAvatar
                size={64}
                name={holder.name}
                photoUrl={holder.imageUrl}
                className="shrink-0 print:hidden"
              />
              <div className="flex min-w-0 flex-col gap-1">
                <MemberName
                  member={holder}
                  className="font-display text-ink text-body-lg font-bold"
                />
                <MemberContact member={holder} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** The top row: the people a visitor needs first, contact visible without a click. */
export function KeyFigureCards({ groups }: { groups: KeyGroup[] }) {
  return (
    <>
      {groups
        .filter((group) => group.figures.length > 0)
        .map((group) => (
          <section
            key={group.title}
            aria-label={group.title}
            className="flex flex-col gap-4"
          >
            <h3 className="font-display text-ink border-ink text-display-sm border-b pb-1 font-bold">
              {group.title}
            </h3>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-3">
              {group.figures.map((figure) => (
                <KeyFigureCard key={figure.nodeId} figure={figure} />
              ))}
            </ul>
          </section>
        ))}
    </>
  );
}

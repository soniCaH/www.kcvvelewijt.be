import { cn } from "@/lib/utils/cn";
import { EditorialLink, SectionHeader } from "@/components/design-system";
import {
  joinNames,
  type LedgerRow as LedgerRowVM,
  type Chapter,
} from "./club-book";
import { LedgerRow } from "./LedgerRow";

function Ledger({ rows }: { rows: LedgerRowVM[] }) {
  return (
    <ul className="flex flex-col">
      {rows.map((row) => (
        <LedgerRow key={row.id} row={row} />
      ))}
    </ul>
  );
}

/** Small-caps head over one of a pillar's ledgers (Jeugd: Organisatie / Opleiding). */
function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-jersey-deep text-label font-mono font-semibold uppercase print:break-after-avoid">
      {children}
    </h4>
  );
}

/** One chapter of the clubboek: title, purpose, who sits on the board there, then the ledger. */
export function ChapterSection({ chapter }: { chapter: Chapter }) {
  return (
    <section
      aria-label={chapter.title}
      className="flex min-w-0 flex-col print:mb-3 print:break-inside-avoid"
    >
      <div className="border-ink border-t-2 pt-3 print:break-after-avoid">
        <SectionHeader
          as="h3"
          size="display-sm"
          title={chapter.title}
          className="mb-0 sm:mb-0"
        />
      </div>
      <p className="text-ink-muted text-body-sm mt-1 italic print:break-inside-avoid print:break-after-avoid">
        {chapter.purpose}
      </p>
      {chapter.board.length > 0 && (
        <p className="text-body-sm text-ink mt-2 print:mt-1 print:break-inside-avoid">
          <span className="text-jersey-deep font-semibold">
            In het bestuur:
          </span>{" "}
          {joinNames(chapter.board)}
        </p>
      )}
      {chapter.boardLink && (
        <EditorialLink
          href={chapter.boardLink.href}
          className="mt-2 self-start print:hidden"
        >
          {chapter.boardLink.label}
        </EditorialLink>
      )}
      <div className="mt-5 flex flex-col gap-4 print:mt-2 print:gap-2">
        {chapter.sections.map((section) => (
          <div key={section.heading ?? "all"}>
            {section.heading && <SubHead>{section.heading}</SubHead>}
            <Ledger rows={section.rows} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Boxes with no chapter. Rendered last so a box an editor has not placed yet never vanishes. */
export function OverigeFuncties({
  rows,
  className,
}: {
  rows: LedgerRowVM[];
  className?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <section
      aria-label="Overige functies"
      className={cn("flex flex-col print:break-inside-avoid", className)}
    >
      <h3 className="text-jersey-deep text-label font-mono font-semibold uppercase">
        Overige functies
      </h3>
      <Ledger rows={rows} />
    </section>
  );
}

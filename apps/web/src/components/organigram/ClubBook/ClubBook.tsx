import { EditorialLink } from "@/components/design-system";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import { buildClubBook } from "./club-book";
import { KeyFigureCards } from "./KeyFigureCards";
import { OverigeFuncties, PillarChapter } from "./PillarChapter";
import { PdfButton } from "./PdfButton";
import { CLUB_BOOK_PRINT_ROOT } from "./print-style";
import { RowDeepLink } from "./RowDeepLink";

export interface ClubBookProps {
  /** All organigram nodes (`StaffRepository.findAll()`); the synthetic club root is ignored. */
  nodes: OrgChartNode[];
  /** Responsibility paths — the questions each holder answers. */
  responsibilityPaths: ResponsibilityPath[];
}

/**
 * `<ClubBook>` — the `/hulp` structuur section (#3525, prototype A7): the
 * key-figure cards on top, then a "clubboek" ledger per pillar. It replaces the
 * department directory and its side panel; a row unfolds its holders' cards in
 * place.
 *
 * The organigram is who does the work day to day. The board teams
 * (`/club/bestuur`, `/club/jeugdbestuur`) are the board on paper — linked from
 * here, never merged into it.
 *
 * The root carries `club-book-print`: the PDF prints this and nothing else.
 */
export function ClubBook({ nodes, responsibilityPaths }: ClubBookProps) {
  const book = buildClubBook(nodes, responsibilityPaths);

  return (
    <div
      data-testid="club-book"
      className={`${CLUB_BOOK_PRINT_ROOT} flex flex-col gap-12 print:gap-6`}
    >
      <RowDeepLink />
      <div className="flex flex-col gap-8 print:gap-4">
        <KeyFigureCards groups={book.keyGroups} />
        <div className="flex flex-col items-start gap-2">
          {book.raad && (
            <p className="text-ink-muted text-body-sm">
              <span className="text-ink font-semibold">Raad van bestuur: </span>
              {book.raad.map((m) => m.name).join(", ")}
            </p>
          )}
          <EditorialLink href="/club/bestuur" className="print:hidden">
            Bekijk het hoofdbestuur
          </EditorialLink>
        </div>
      </div>

      <PdfButton className="self-start" />

      <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-2 print:block print:columns-2 print:gap-x-6">
        {book.pillars.map((pillar) => (
          <PillarChapter key={pillar.key} pillar={pillar} />
        ))}
      </div>

      <OverigeFuncties rows={book.overige} />
    </div>
  );
}

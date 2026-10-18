import { EditorialLink } from "@/components/design-system";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import { buildClubBook, joinNames } from "./club-book";
import { KeyFigureCards } from "./KeyFigureCards";
import { ChapterSection, OverigeFuncties } from "./ChapterSection";
import { PdfButton } from "./PdfButton";
import { PrintHeader, PrintSheetFrame } from "./PrintFrame";
import { CLUB_BOOK_PRINT_ROOT } from "./print-style";
import { RowDeepLink } from "./RowDeepLink";

export interface ClubBookProps {
  /** All organigram nodes (`StaffRepository.findAll()`); the synthetic club root is ignored. */
  nodes: OrgChartNode[];
  /** Responsibility paths — the questions each holder answers. */
  responsibilityPaths: ResponsibilityPath[];
  /** "Now", for the season in the PDF's header. Defaults to the render time. */
  now?: Date;
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
export function ClubBook({
  nodes,
  responsibilityPaths,
  now = new Date(),
}: ClubBookProps) {
  const book = buildClubBook(nodes, responsibilityPaths);

  return (
    <div data-testid="club-book" className={CLUB_BOOK_PRINT_ROOT}>
      <div className="flex flex-col gap-12 print:gap-3">
        <RowDeepLink />
        <PrintSheetFrame />
        <PrintHeader now={now} />
        <div className="flex flex-col gap-8 print:gap-2">
          <KeyFigureCards groups={book.keyGroups} />
          <div className="flex flex-col items-start gap-2">
            {book.raad && (
              <p
                // A target for `openStructureRow` — the Bestuursorgaan box has no
                // ledger row, this line is where it lives.
                data-key-node-id={book.raad.nodeId}
                data-key-member-id={book.raad.members[0]?.id}
                tabIndex={-1}
                className="text-ink-muted text-body-sm"
              >
                <span className="text-ink font-semibold">
                  Raad van bestuur:{" "}
                </span>
                {joinNames(book.raad.members)}
              </p>
            )}
            <EditorialLink href={book.boardLink.href} className="print:hidden">
              {book.boardLink.label}
            </EditorialLink>
          </div>
        </div>

        <PdfButton className="self-start" />

        <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-2 print:block print:columns-2 print:break-before-page print:gap-x-6">
          {book.chapters.map((chapter) => (
            <ChapterSection key={chapter.key} chapter={chapter} />
          ))}
          {/* Inside the grid so that on paper it flows into the shorter column. */}
          <OverigeFuncties rows={book.overige} className="lg:col-span-2" />
        </div>
      </div>
    </div>
  );
}

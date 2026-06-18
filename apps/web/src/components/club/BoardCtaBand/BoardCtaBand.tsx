import { CtaBand } from "@/components/design-system";

/**
 * <BoardCtaBand> — closing band on the board pages. The shared `<CtaBand>` with
 * board copy ("Wie doet wat?") + a `warm` paper-stamp "Organigram bekijken",
 * pointing at the organigram so a visitor who couldn't find the right board
 * member lands on the full "wie doet wat" overview. Render full-bleed as the
 * page's last element.
 */
export function BoardCtaBand() {
  return (
    <CtaBand
      ariaLabel="Organigram"
      heading="Wie doet wat?"
      emphasis={{ text: "doet wat", tone: "warm" }}
      lead="Bekijk het volledige organigram van KCVV Elewijt en vind snel de juiste persoon voor jouw vraag."
      buttonLabel="Organigram bekijken"
      href="/hulp#structuur"
    />
  );
}

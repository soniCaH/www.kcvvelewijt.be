import {
  EditorialHeading,
  LinkButton,
  StripedSeam,
} from "@/components/design-system";

/**
 * <BoardCtaBand> — closing band on the board pages. Mirrors the
 * `<SponsorCtaBand>` dark-band idiom (leading `<StripedSeam>` + full-width
 * `bg-jersey-deep-dark` band with an italic question + sub-line + a `warm`
 * paper-stamp CTA), pointing at the organigram so a visitor who couldn't find
 * the right board member lands on the full "wie doet wat" overview.
 *
 * The button reuses `<LinkButton variant="inverted">` recoloured to `bg-warm`
 * — the same per-surface CtaBand pattern as `<SponsorCtaBand>`; both should
 * fold into a shared `<CtaBand>` primitive once a third consumer lands.
 */
export function BoardCtaBand() {
  return (
    <>
      <StripedSeam colorPair="ink-cream" height="md" />
      <section
        aria-label="Organigram"
        className="bg-jersey-deep-dark border-ink border-y-2"
      >
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:py-16">
          <EditorialHeading
            level={2}
            size="display-lg"
            tone="cream"
            emphasis={{ text: "doet wat", tone: "warm" }}
            className="mb-4"
          >
            Wie doet wat?
          </EditorialHeading>

          <p className="text-cream/90 mx-auto mb-7 max-w-xl text-base leading-relaxed">
            Bekijk het volledige organigram van KCVV Elewijt en vind snel de
            juiste persoon voor jouw vraag.
          </p>

          <div className="flex justify-center">
            <LinkButton
              href="/club/organigram"
              variant="inverted"
              className="bg-warm hover:bg-warm"
            >
              Organigram bekijken
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}

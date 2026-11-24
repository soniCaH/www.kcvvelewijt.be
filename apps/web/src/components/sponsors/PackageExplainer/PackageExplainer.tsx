import { PageContainer } from "@/components/design-system";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { SectionHeader } from "@/components/design-system/SectionHeader";
import { TapedCard } from "@/components/design-system/TapedCard";
import { TapedCardGrid } from "@/components/design-system/TapedCardGrid";
import { TrackInView } from "@/components/analytics/TrackInView";

/** The sponsoring address, shown beside the contact role (#2594). */
const SPONSORING_EMAIL = "sponsoring@kcvvelewijt.be";

interface Package {
  name: string;
  description: string;
}

// Club policy, not CMS content (#3618 slice d). No price and no matchbal or
// onderleggers entry: Kevin's call of 2026-11-24. The brochure's other packages
// are not listed until its copy is retyped: nothing here is invented (#2594).
const PACKAGES: Package[] = [
  {
    name: "Een ploeg steunen",
    description: "Je naam op de pagina van die ploeg.",
  },
  {
    name: "Na elk seizoen",
    description: "Een overzicht van wat je logo bereikte.",
  },
];

export interface PackageExplainerProps {
  /** Name of the contact person. Shown only when passed; the page passes none
   *  (a name needs board approval, #3618). */
  contactName?: string;
}

/**
 * <PackageExplainer> — "Wat krijgt een partner?" on `/sponsors` (#3654): what a
 * partner gets and a contact role. No price, no tier names and no
 * tier-to-placement promise: the brochure names no tiers (#2594). Fires `sponsor_packages_view` once it is 40% in view.
 */
export function PackageExplainer({ contactName }: PackageExplainerProps) {
  return (
    <TrackInView eventName="sponsor_packages_view" threshold={0.4}>
      <PageContainer
        as="section"
        width="index"
        ariaLabel="Wat krijgt een partner?"
        className="py-10 sm:py-14"
      >
        <SectionHeader
          title="Wat krijgt een partner?"
          emphasis={{ text: "partner" }}
        />

        <TapedCardGrid columns={2} gap="md" as="ul">
          {PACKAGES.map(({ name, description }) => (
            <TapedCard
              key={name}
              bg="cream-soft"
              shadow="sm"
              className="flex flex-col gap-3"
            >
              <h3 className="font-display text-ink text-xl font-bold">
                {name}
              </h3>
              <p className="text-ink text-body-sm">{description}</p>
            </TapedCard>
          ))}
        </TapedCardGrid>

        <div className="mt-10 flex flex-col gap-2 sm:mt-12">
          <p className="font-display text-ink text-display-sm italic">
            Benieuwd wat er voor jouw zaak kan? Laten we praten.
          </p>
          <MonoLabel>Verantwoordelijke Sponsoring</MonoLabel>
          {contactName && (
            <p className="text-ink text-lg font-bold">{contactName}</p>
          )}
          <p>
            <a href={`mailto:${SPONSORING_EMAIL}`} className="prose-link">
              {SPONSORING_EMAIL}
            </a>
          </p>
        </div>
      </PageContainer>
    </TrackInView>
  );
}

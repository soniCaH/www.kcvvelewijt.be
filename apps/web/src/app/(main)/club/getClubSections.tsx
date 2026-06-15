import type { ReactNode } from "react";
import type { SectionConfig } from "@/components/design-system/SectionStack/SectionStack";
import { PageHero } from "@/components/layout/PageHero";

interface ClubSectionsContent {
  editorial: ReactNode;
  mission: ReactNode;
  contact: ReactNode;
}

export function getClubSections(content: ClubSectionsContent): SectionConfig[] {
  return [
    {
      key: "hero",
      // Cream paper-card hero on a cream field. The legacy dark-gradient hero
      // section + diagonal seam is retired here; the rest of the /club index
      // (editorial grid + mission + contact) stays legacy until #2121's full
      // index redesign.
      bg: "transparent",
      content: (
        <div className="bg-cream px-4 pt-10 pb-14 md:px-10">
          <div className="mx-auto max-w-5xl">
            <PageHero
              kicker="Onze club"
              headline="De plezantste compagnie"
              accent="compagnie"
              lead="Al meer dan 75 jaar de thuishaven voor voetballiefhebbers in Elewijt. Van de allerkleinsten tot het eerste elftal — bij KCVV is iedereen welkom."
            />
          </div>
        </div>
      ),
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
    },
    {
      key: "editorial",
      bg: "gray-100",
      content: content.editorial,
      paddingTop: "pt-20",
      paddingBottom: "pb-20",
      transition: {
        type: "diagonal",
        direction: "left",
      },
    },
    {
      key: "mission",
      bg: "kcvv-green-dark",
      content: content.mission,
      paddingTop: "pt-20",
      paddingBottom: "pb-20",
      transition: {
        type: "diagonal",
        direction: "right",
      },
    },
    {
      key: "contact",
      bg: "gray-100",
      content: content.contact,
      paddingTop: "pt-16",
      paddingBottom: "pb-16",
    },
  ];
}

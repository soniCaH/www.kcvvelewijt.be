import type { ReactNode } from "react";
import type { SectionConfig } from "@/components/design-system/SectionStack/SectionStack";
import { InteriorPageHero } from "@/components/layout/InteriorPageHero";

interface ClubSectionsContent {
  editorial: ReactNode;
  mission: ReactNode;
  contact: ReactNode;
}

export function getClubSections(content: ClubSectionsContent): SectionConfig[] {
  return [
    {
      key: "hero",
      bg: "kcvv-black",
      content: (
        <InteriorPageHero
          label="Onze club"
          headline={
            <>
              De plezantste
              <br />
              <span className="text-kcvv-green">compagnie</span>
            </>
          }
          body="Al meer dan 75 jaar de thuishaven voor voetballiefhebbers in Elewijt. Van de allerkleinsten tot het eerste elftal — bij KCVV is iedereen welkom."
        />
      ),
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
      transition: {
        type: "diagonal",
        direction: "right",
        overlap: "full",
      },
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

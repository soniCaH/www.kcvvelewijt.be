import type { ReactNode } from "react";
import type { SectionConfig } from "@/components/design-system/SectionStack/SectionStack";
import { PageHero } from "@/components/design-system/PageHero";

interface JeugdSectionsContent {
  editorial: ReactNode;
  teams: ReactNode;
  quote: ReactNode;
  cta: ReactNode;
}

export function getJeugdSections(
  content: JeugdSectionsContent,
): SectionConfig[] {
  return [
    {
      key: "hero",
      bg: "kcvv-black",
      content: (
        <PageHero
          image="/images/hero-jeugd.jpg"
          label="Jeugdopleiding"
          headline={
            <>
              De toekomst
              <br />
              van <span className="text-kcvv-green">Elewijt</span>
            </>
          }
          body="Meer dan 200 jonge voetballers. Gediplomeerde trainers. Eén missie: plezier, techniek en teamspirit."
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
      key: "teams",
      bg: "kcvv-black",
      content: content.teams,
      paddingTop: "pt-20",
      paddingBottom: "pb-20",
      transition: {
        type: "diagonal",
        direction: "right",
      },
    },
    {
      key: "quote",
      bg: "kcvv-green-dark",
      content: content.quote,
      paddingTop: "pt-20",
      paddingBottom: "pb-20",
      transition: {
        type: "diagonal",
        direction: "right",
      },
    },
    {
      key: "cta",
      bg: "gray-100",
      content: content.cta,
      paddingTop: "pt-16",
      paddingBottom: "pb-16",
    },
  ];
}

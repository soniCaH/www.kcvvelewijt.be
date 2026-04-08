import type { ReactNode } from "react";
import type { SectionConfig } from "@/components/design-system/SectionStack/SectionStack";

interface SponsorsSectionsContent {
  header: ReactNode;
  spotlight: ReactNode | false;
  grid: ReactNode;
  cta: ReactNode;
}

export function getSponsorsSections(
  content: SponsorsSectionsContent,
): SectionConfig[] {
  const sections: SectionConfig[] = [
    {
      key: "header",
      bg: "kcvv-black",
      content: content.header,
      paddingTop: "pt-16",
      paddingBottom: "pb-24",
      transition: { type: "diagonal", direction: "right", overlap: "full" },
    },
  ];

  if (content.spotlight !== false) {
    sections.push({
      key: "spotlight",
      bg: "kcvv-green-dark",
      content: content.spotlight,
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
      transition: { type: "diagonal", direction: "right" },
    });
  }

  sections.push(
    {
      key: "grid",
      bg: "gray-100",
      content: content.grid,
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
      transition: { type: "diagonal", direction: "left" },
    },
    {
      key: "cta",
      bg: "kcvv-black",
      content: content.cta,
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
    },
  );

  return sections;
}

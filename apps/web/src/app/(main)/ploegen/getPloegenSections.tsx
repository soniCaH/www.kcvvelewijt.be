import type { ReactNode } from "react";
import type { SectionConfig } from "@/components/design-system/SectionStack/SectionStack";

interface PloegenSectionsContent {
  hero?: ReactNode;
  featured?: ReactNode;
  youth: ReactNode;
  cta: ReactNode;
}

export function getPloegenSections(
  content: PloegenSectionsContent,
): SectionConfig[] {
  return [
    content.hero && {
      key: "hero",
      bg: "kcvv-black",
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
      content: content.hero,
      transition: {
        type: "diagonal",
        direction: "right",
        overlap: "full",
      },
    },
    content.featured && {
      key: "featured",
      bg: "gray-100",
      paddingTop: "pt-20",
      paddingBottom: "pb-20",
      content: content.featured,
      transition: {
        type: "diagonal",
        direction: "left",
      },
    },
    {
      key: "youth",
      bg: "kcvv-black",
      paddingTop: "pt-20",
      paddingBottom: "pb-20",
      content: content.youth,
      transition: {
        type: "diagonal",
        direction: "right",
      },
    },
    {
      key: "cta",
      bg: "gray-100",
      paddingTop: "pt-16",
      paddingBottom: "pb-16",
      content: content.cta,
    },
  ].filter(Boolean) as SectionConfig[];
}

/**
 * SponsorsPage Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { SponsorsPage } from "./SponsorsPage";
import type { Sponsor } from "../Sponsors";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const hoofdsponsors: Sponsor[] = [
  {
    id: "1",
    name: "Hoofdsponsor A",
    logo: "/logo-a.png",
    tier: "hoofdsponsor",
    featured: true,
  },
  {
    id: "2",
    name: "Hoofdsponsor B",
    logo: "/logo-b.png",
    tier: "hoofdsponsor",
    featured: false,
  },
];

const sponsors: Sponsor[] = [
  {
    id: "3",
    name: "Sponsor C",
    logo: "/logo-c.png",
    tier: "sponsor",
    featured: false,
  },
];

const sympathisanten: Sponsor[] = [
  {
    id: "4",
    name: "Sympathisant D",
    logo: "/logo-d.png",
    tier: "sympathisant",
    featured: false,
  },
];

const featuredSponsors: Sponsor[] = hoofdsponsors.filter((s) => s.featured);

describe("SponsorsPage", () => {
  describe("SponsorsStats removed", () => {
    it("does not render sponsor count stats text", () => {
      render(
        <SponsorsPage
          goldSponsors={hoofdsponsors}
          silverSponsors={sponsors}
          bronzeSponsors={sympathisanten}
          featuredSponsors={featuredSponsors}
        />,
      );

      expect(screen.queryByText(/trouwe partner/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/steunen kcvv elewijt/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("intro text", () => {
    it("renders an intro paragraph below the page title", () => {
      render(
        <SponsorsPage
          goldSponsors={hoofdsponsors}
          silverSponsors={sponsors}
          bronzeSponsors={sympathisanten}
          featuredSponsors={featuredSponsors}
        />,
      );

      const intro = screen.getByTestId("sponsors-intro");
      expect(intro).toBeInTheDocument();
    });
  });

  describe("SponsorsSpotlight conditional rendering", () => {
    it("renders spotlight section when featuredSponsors exist", () => {
      render(
        <SponsorsPage
          goldSponsors={hoofdsponsors}
          silverSponsors={sponsors}
          bronzeSponsors={sympathisanten}
          featuredSponsors={featuredSponsors}
        />,
      );

      expect(screen.getByText(/in de kijker/i)).toBeInTheDocument();
    });

    it("does not render spotlight section when no featuredSponsors", () => {
      render(
        <SponsorsPage
          goldSponsors={hoofdsponsors}
          silverSponsors={sponsors}
          bronzeSponsors={sympathisanten}
          featuredSponsors={[]}
        />,
      );

      expect(screen.queryByText(/in de kijker/i)).not.toBeInTheDocument();
    });
  });

  describe("no tier headings", () => {
    it("does not render gold/silver/bronze tier headings", () => {
      render(
        <SponsorsPage
          goldSponsors={hoofdsponsors}
          silverSponsors={sponsors}
          bronzeSponsors={sympathisanten}
          featuredSponsors={featuredSponsors}
        />,
      );

      expect(screen.queryByText(/gouden sponsors/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/zilveren sponsors/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bronzen sponsors/i)).not.toBeInTheDocument();
    });
  });

  describe("logos only grid", () => {
    it("does not show sponsor names in the main grid", () => {
      render(
        <SponsorsPage
          goldSponsors={hoofdsponsors}
          silverSponsors={sponsors}
          bronzeSponsors={sympathisanten}
          featuredSponsors={[]}
        />,
      );

      // SponsorCard with showName=false renders logos via alt text but no visible name text
      expect(screen.queryByText("Hoofdsponsor A")).not.toBeInTheDocument();
      expect(screen.queryByText("Sponsor C")).not.toBeInTheDocument();
    });
  });
});

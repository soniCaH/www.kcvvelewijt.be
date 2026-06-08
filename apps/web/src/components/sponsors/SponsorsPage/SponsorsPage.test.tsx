/**
 * SponsorsPage Component Tests — Phase 7.
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

const sponsors: Sponsor[] = [
  {
    id: "1",
    name: "Hoofdsponsor A",
    logo: "/logo-a.png",
    url: "https://example.com/a",
    tier: "hoofdsponsor",
  },
  {
    id: "2",
    name: "Sponsor B",
    logo: "/logo-b.png",
    tier: "sponsor",
  },
  {
    id: "3",
    name: "Sympathisant C",
    logo: "",
    tier: "sympathisant",
  },
];

describe("SponsorsPage", () => {
  it("renders a level-1 heading", () => {
    render(<SponsorsPage sponsors={sponsors} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders the club-motto kicker", () => {
    render(<SponsorsPage sponsors={sponsors} />);
    expect(
      screen.getByText("Er is maar één plezante compagnie"),
    ).toBeInTheDocument();
  });

  it("renders one tile per sponsor across the hoofd grid and wall", () => {
    render(<SponsorsPage sponsors={sponsors} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(sponsors.length);
  });

  it("labels the Hoofdsponsors group and renders the striped seam", () => {
    const { container } = render(<SponsorsPage sponsors={sponsors} />);
    expect(screen.getByText("Hoofdsponsors")).toBeInTheDocument();
    expect(
      container.querySelector('[data-color-pair="ink-cream"]'),
    ).toBeInTheDocument();
  });

  it("collapses the hero (no marquee) when no sponsor is featured", () => {
    render(<SponsorsPage sponsors={sponsors} />);
    expect(screen.queryByText("In de kijker")).not.toBeInTheDocument();
  });

  it("surfaces the featured sponsor in the hero marquee", () => {
    render(
      <SponsorsPage
        sponsors={[
          ...sponsors,
          {
            id: "feat",
            name: "Featured Co",
            logo: "/feat.png",
            url: "https://example.com/feat",
            tier: "hoofdsponsor",
            featured: true,
          },
        ]}
      />,
    );
    expect(screen.getByText("In de kijker")).toBeInTheDocument();
  });

  it("does not compose with SectionStack diagonal transitions", () => {
    render(<SponsorsPage sponsors={sponsors} />);
    expect(screen.queryByTestId("section-transition")).toBeNull();
  });

  it("does not render the legacy dark kcvv-black header background", () => {
    const { container } = render(<SponsorsPage sponsors={sponsors} />);
    expect(container.querySelector('[class*="kcvv-black"]')).toBeNull();
  });

  it("always renders the CTA band", () => {
    render(<SponsorsPage sponsors={sponsors} />);
    // EditorialHeading splits the title across spans for the warm accent, so
    // match by heading name rather than a single text node.
    expect(
      screen.getByRole("heading", { name: /Jouw zaak ook langs de zijlijn/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Word sponsor/i }),
    ).toBeInTheDocument();
  });

  it("collapses to the empty state + CTA band when there are no sponsors", () => {
    render(<SponsorsPage sponsors={[]} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.queryByText("Hoofdsponsors")).not.toBeInTheDocument();
    // The reskinned empty state + the CTA band both render.
    expect(
      screen.getByRole("heading", { name: /Nog geen sponsors/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Jouw zaak ook langs de zijlijn/ }),
    ).toBeInTheDocument();
  });
});

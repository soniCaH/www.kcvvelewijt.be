import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { SponsorHero } from "./SponsorHero";
import type { Sponsor } from "../Sponsors";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...rest }: ImageProps) => {
    const props = { alt, src: typeof src === "string" ? src : "", ...rest };
    return <img {...props} />;
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

const featured: Sponsor = {
  id: "s-1",
  name: "Garage Peeters",
  logo: "https://example.com/peeters.png",
  url: "https://example.com/peeters",
  tier: "hoofdsponsor",
  featured: true,
  description: "Leverde de wedstrijdballen voor het hele seizoen.",
};

describe("SponsorHero", () => {
  it("renders the kicker, level-1 heading and lead", () => {
    render(<SponsorHero featured={featured} />);
    expect(screen.getByText("Sponsors & sympathisanten")).toBeInTheDocument();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Merci aan onze sponsors.");
    expect(
      screen.getByText("Samen met hen blijven we de plezantste compagnie."),
    ).toBeInTheDocument();
  });

  it("renders the featured marquee card when a sponsor is provided", () => {
    render(<SponsorHero featured={featured} />);
    expect(screen.getByText("In de kijker")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Bezoek de website van Garage Peeters",
      }),
    ).toBeInTheDocument();
  });

  it("collapses to a headline-only hero when there is no featured sponsor", () => {
    render(<SponsorHero featured={null} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryByText("In de kijker")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

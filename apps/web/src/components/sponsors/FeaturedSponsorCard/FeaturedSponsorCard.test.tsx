import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { FeaturedSponsorCard } from "./FeaturedSponsorCard";
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

const base: Sponsor = {
  id: "s-1",
  name: "Garage Peeters",
  logo: "https://example.com/peeters.png",
  url: "https://example.com/peeters",
  tier: "hoofdsponsor",
  featured: true,
  description: "Hoofdsponsor sinds dag één — leverde de wedstrijdballen.",
};

describe("FeaturedSponsorCard", () => {
  it('renders the "In de kijker" tab', () => {
    render(<FeaturedSponsorCard sponsor={base} />);
    expect(screen.getByText("In de kijker")).toBeInTheDocument();
  });

  it("renders the logo with sponsor alt text and the italic name", () => {
    render(<FeaturedSponsorCard sponsor={base} />);
    expect(
      screen.getByAltText("Garage Peeters — sponsor KCVV Elewijt"),
    ).toHaveAttribute("src", base.logo);
    expect(screen.getByText("Garage Peeters")).toBeInTheDocument();
  });

  it("renders the description blurb when present", () => {
    render(<FeaturedSponsorCard sponsor={base} />);
    expect(screen.getByText(base.description as string)).toBeInTheDocument();
  });

  it('renders a "Bezoek website" affordance linking out when a url is present', () => {
    render(<FeaturedSponsorCard sponsor={base} />);
    const link = screen.getByRole("link", {
      name: "Bezoek de website van Garage Peeters",
    });
    expect(link).toHaveAttribute("href", base.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Bezoek website ↗")).toBeInTheDocument();
  });

  it("falls back to the italic name in the inset when there is no logo", () => {
    render(<FeaturedSponsorCard sponsor={{ ...base, logo: "" }} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    // The name appears twice (inset fallback + caption) when there is no logo.
    expect(screen.getAllByText("Garage Peeters")).toHaveLength(2);
  });

  it("omits the blurb when there is no description", () => {
    render(
      <FeaturedSponsorCard sponsor={{ ...base, description: undefined }} />,
    );
    expect(
      screen.queryByText(base.description as string),
    ).not.toBeInTheDocument();
  });

  it("renders a static card with no link and no visit affordance when there is no url", () => {
    render(<FeaturedSponsorCard sponsor={{ ...base, url: undefined }} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("Bezoek website ↗")).not.toBeInTheDocument();
    // The card still renders its logo + name.
    expect(
      screen.getByAltText("Garage Peeters — sponsor KCVV Elewijt"),
    ).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { HoofdSponsorTile } from "./HoofdSponsorTile";
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
  id: "h-1",
  name: "Garage Peeters",
  logo: "https://example.com/peeters.png",
  url: "https://example.com/peeters",
  tier: "hoofdsponsor",
};

describe("HoofdSponsorTile", () => {
  it("renders the logo with sponsor alt text and the italic name caption", () => {
    render(<HoofdSponsorTile sponsor={base} />);
    expect(
      screen.getByAltText("Garage Peeters — sponsor KCVV Elewijt"),
    ).toHaveAttribute("src", base.logo);
    expect(screen.getByText("Garage Peeters")).toBeInTheDocument();
  });

  it("wraps the tile in a secure external link when a url is present", () => {
    render(<HoofdSponsorTile sponsor={base} />);
    const link = screen.getByRole("link", {
      name: "Bezoek de website van Garage Peeters",
    });
    expect(link).toHaveAttribute("href", base.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("falls back to the italic wordmark in the logo slot when there is no logo", () => {
    render(<HoofdSponsorTile sponsor={{ ...base, logo: "" }} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    // Name appears twice with no logo: the inset fallback + the caption.
    expect(screen.getAllByText("Garage Peeters")).toHaveLength(2);
  });

  it("renders a static tile (no link) when there is no url", () => {
    render(<HoofdSponsorTile sponsor={{ ...base, url: undefined }} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByAltText("Garage Peeters — sponsor KCVV Elewijt"),
    ).toBeInTheDocument();
  });
});

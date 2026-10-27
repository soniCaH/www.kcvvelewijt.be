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
  useLinkStatus: () => ({ pending: false }),
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
  it("renders the logo as decoration inside the link and the italic name caption", () => {
    render(<HoofdSponsorTile sponsor={base} />);
    // Inside the link the visible name already says it: the logo is
    // decorative, so the link's name holds the name once (#3690).
    const logo = document.querySelector("img");
    expect(logo).toHaveAttribute("src", base.logo);
    expect(logo).toHaveAttribute("alt", "");
    expect(screen.getByText("Garage Peeters")).toBeInTheDocument();
  });

  it("wraps the tile in a secure external link when a url is present", () => {
    render(<HoofdSponsorTile sponsor={base} />);
    const link = screen.getByRole("link", {
      name: "Garage Peeters",
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

  it("renders the logo in colour at rest — /sponsors is the exception to the wall's greyscale rule", () => {
    render(<HoofdSponsorTile sponsor={base} />);
    expect(document.querySelector("img")).not.toHaveClass("grayscale");
  });
});

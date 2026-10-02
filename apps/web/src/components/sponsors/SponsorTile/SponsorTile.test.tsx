import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { SponsorTile } from "./SponsorTile";
import type { Sponsor } from "../Sponsors";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...rest }: ImageProps) => {
    const props = { alt, src: typeof src === "string" ? src : "", ...rest };
    return <img {...props} />;
  },
}));

const base: Sponsor = {
  id: "s-1",
  name: "Bakkerij Peeters",
  logo: "https://example.com/peeters.png",
  url: "https://example.com/peeters",
  tier: "hoofdsponsor",
};

describe("SponsorTile", () => {
  it("renders the logo image with sponsor alt text when a logo is present", () => {
    render(<SponsorTile sponsor={base} />);
    const img = screen.getByAltText("Bakkerij Peeters — sponsor KCVV Elewijt");
    expect(img).toHaveAttribute("src", base.logo);
  });

  it("renders an italic wordmark fallback when the sponsor has no logo", () => {
    render(<SponsorTile sponsor={{ ...base, logo: "" }} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Bakkerij Peeters")).toBeInTheDocument();
  });

  it("wraps the tile in a secure external link when a url is present", () => {
    render(<SponsorTile sponsor={base} />);
    const link = screen.getByRole("link", {
      name: "Bezoek de website van Bakkerij Peeters",
    });
    expect(link).toHaveAttribute("href", base.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders no link when the sponsor has no url", () => {
    render(<SponsorTile sponsor={{ ...base, url: undefined }} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByAltText("Bakkerij Peeters — sponsor KCVV Elewijt"),
    ).toBeInTheDocument();
  });

  it("sets a responsive sizes hint on the logo image", () => {
    render(<SponsorTile sponsor={base} />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "sizes",
      "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw",
    );
  });

  it("renders the logo greyscale-to-colour-on-hover by default (colorAtRest unset)", () => {
    render(<SponsorTile sponsor={base} />);
    expect(screen.getByRole("img")).toHaveClass(
      "grayscale",
      "group-hover:grayscale-0",
      "group-focus-visible:grayscale-0",
    );
  });

  it("renders the logo in colour at rest when colorAtRest is true, with no greyscale filter", () => {
    render(<SponsorTile sponsor={base} colorAtRest />);
    const img = screen.getByRole("img");
    expect(img).not.toHaveClass("grayscale");
    expect(img).not.toHaveClass("group-hover:grayscale-0");
    expect(img).not.toHaveClass("group-focus-visible:grayscale-0");
  });

  it("presses the tile down on hover only when it is framed AND a link", () => {
    const { rerender } = render(<SponsorTile sponsor={base} framed />);
    const framedTile = screen.getByRole("link").firstElementChild;
    expect(framedTile).toHaveClass(
      "group-hover:translate-x-1",
      "group-focus-visible:translate-x-1",
      "transition-[translate,box-shadow]",
    );

    rerender(<SponsorTile sponsor={base} />);
    const unframedTile = screen.getByRole("link").firstElementChild;
    expect(unframedTile).not.toHaveClass("group-hover:translate-x-1");
    expect(unframedTile).not.toHaveClass("group-hover:shadow-none");
    expect(unframedTile).not.toHaveClass("transition-[translate,box-shadow]");
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { IdentityBand } from "./IdentityBand";

vi.mock("next/image", () => ({
  default: ({ alt, src, fill: _fill, ...rest }: ImageProps) => (
    <img alt={alt} src={typeof src === "string" ? src : ""} {...rest} />
  ),
}));

describe("IdentityBand", () => {
  it("renders the kicker", () => {
    render(<IdentityBand />);
    expect(
      screen.getByText("KCVV Elewijt · Stamnummer 55"),
    ).toBeInTheDocument();
  });

  it("renders the heading as an h2, never an h1", () => {
    const { container } = render(<IdentityBand />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /er is maar één plezante compagnie/i,
      }),
    ).toBeInTheDocument();
    expect(container.querySelector("h1")).toBeNull();
  });

  it("puts the warm emphasis on 'plezante'", () => {
    const { container } = render(<IdentityBand />);
    expect(container.querySelector("h2 em")?.textContent?.trim()).toBe(
      "plezante",
    );
  });

  it("links 'Word lid' to /club/word-lid and 'Onze club' to /club/geschiedenis", () => {
    render(<IdentityBand />);
    const primary = screen.getByRole("link", { name: /word lid/i });
    expect(primary).toHaveAttribute("href", "/club/word-lid");
    expect(primary).toHaveAttribute("data-identity-cta", "word_lid");
    const secondary = screen.getByRole("link", { name: /onze club/i });
    expect(secondary).toHaveAttribute("href", "/club/geschiedenis");
    expect(secondary).toHaveAttribute("data-identity-cta", "onze_club");
  });

  it("uses the decorative huddle photo and no seam of its own", () => {
    const { container } = render(<IdentityBand />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/images/identity-huddle.jpg");
    expect(img?.getAttribute("alt")).toBe("");
    expect(container.querySelector("svg[data-color-pair]")).toBeNull();
  });
});

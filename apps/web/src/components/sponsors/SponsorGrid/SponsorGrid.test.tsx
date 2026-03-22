/**
 * SponsorGrid Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { SponsorGrid } from "./SponsorGrid";
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
    ...props
  }: { children: React.ReactNode } & Record<string, unknown>) => (
    <a {...props}>{children}</a>
  ),
}));

const sponsors: Sponsor[] = [
  { id: "1", name: "Sponsor A", logo: "/a.png", url: "https://a.com" },
  { id: "2", name: "Sponsor B", logo: "/b.png" },
];

describe("SponsorGrid", () => {
  it("renders all sponsors", () => {
    render(<SponsorGrid sponsors={sponsors} />);

    expect(screen.getByAltText("Sponsor A")).toBeInTheDocument();
    expect(screen.getByAltText("Sponsor B")).toBeInTheDocument();
  });

  it("returns null for empty sponsors", () => {
    const { container } = render(<SponsorGrid sponsors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("passes variant to SponsorCard children", () => {
    render(<SponsorGrid sponsors={sponsors} variant="dark" />);

    const images = screen.getAllByRole("img");
    images.forEach((img) => {
      expect(img).toHaveClass("invert");
    });
  });

  it("applies grid column classes", () => {
    const { container } = render(
      <SponsorGrid sponsors={sponsors} columns={3} />,
    );

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("lg:grid-cols-3");
  });
});

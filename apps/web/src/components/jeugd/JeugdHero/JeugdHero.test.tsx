import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { JeugdHero } from "./JeugdHero";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...rest }: ImageProps) => {
    const props = { alt, src: typeof src === "string" ? src : "", ...rest };
    return <img {...props} />;
  },
}));

describe("JeugdHero", () => {
  it("renders the kicker, level-1 heading (with jersey-deep period) and parent lead", () => {
    render(<JeugdHero />);

    expect(
      screen.getByText("De jeugdopleiding · U6 tot U21"),
    ).toBeInTheDocument();

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Beter worden begint met plezier.");

    // The lead keeps the "gediplomeerde trainers" hook from the voice lock.
    expect(
      screen.getByText(/gediplomeerde trainers en plezier als motor/i),
    ).toBeInTheDocument();
  });

  it("renders the division-path mono line", () => {
    render(<JeugdHero />);
    expect(
      screen.getByText("Onderbouw → Middenbouw → Bovenbouw"),
    ).toBeInTheDocument();
  });

  it("renders the youth photo, defaulting to the committed youth asset", () => {
    render(<JeugdHero />);
    const img = screen.getByRole("img", {
      name: /jeugdspelers van kcvv elewijt tijdens een training/i,
    });
    expect(img).toHaveAttribute("src", "/images/youth-trainers.jpg");
  });

  it("honours a custom imageUrl", () => {
    render(<JeugdHero imageUrl="/images/custom-youth.jpg" />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/images/custom-youth.jpg",
    );
  });
});

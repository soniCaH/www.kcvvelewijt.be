import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UltrasHero } from "./UltrasHero";

const FB = "https://www.facebook.com/KCVV.ULTRAS.55/";

describe("UltrasHero", () => {
  it("renders the kicker and the poster headline", () => {
    render(<UltrasHero joinHref={FB} />);
    expect(
      screen.getByText(/Supporters · KCVV Ultra's 55/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /de luidste hoek/i }),
    ).toBeInTheDocument();
  });

  it("renders a hardened external join CTA carrying the analytics marker", () => {
    render(<UltrasHero joinHref={FB} />);
    const cta = screen.getByRole("link", { name: /word lid via facebook/i });
    expect(cta).toHaveAttribute("href", FB);
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
    expect(cta).toHaveAttribute("data-ultras-join");
  });
});

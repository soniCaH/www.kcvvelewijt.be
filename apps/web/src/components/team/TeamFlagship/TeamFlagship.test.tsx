/**
 * TeamFlagship unit tests.
 *
 * Covers:
 *  - variant data-attribute (a / b)
 *  - kicker + category + meta (division · season) render
 *  - whole block links to href
 *  - photo state vs JerseyShirt fallback
 *  - meta omits empty division/season cleanly
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamFlagship } from "./TeamFlagship";

describe("TeamFlagship", () => {
  it("renders the A variant with data-variant='a' and links to href", () => {
    render(
      <TeamFlagship
        variant="a"
        kicker="Eerste elftal"
        category="A-ploeg"
        division="3e Nat. A"
        season="25/26"
        href="/ploegen/eerste-elftallen-a"
      />,
    );
    const flagship = screen.getByTestId("team-flagship");
    expect(flagship.tagName).toBe("A");
    expect(flagship.getAttribute("data-variant")).toBe("a");
    expect(flagship.getAttribute("href")).toBe("/ploegen/eerste-elftallen-a");
  });

  it("renders kicker, category headline and division · season meta", () => {
    render(
      <TeamFlagship
        variant="a"
        kicker="Eerste elftal"
        category="A-ploeg"
        division="3e Nat. A"
        season="25/26"
        href="/x"
      />,
    );
    const flagship = screen.getByTestId("team-flagship");
    expect(flagship.textContent).toContain("Eerste elftal");
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "A-ploeg.",
    );
    expect(flagship.textContent).toContain("3e Nat. A · 25/26");
  });

  it("renders the B variant", () => {
    render(
      <TeamFlagship
        variant="b"
        kicker="Tweede elftal"
        category="B-ploeg"
        href="/y"
      />,
    );
    expect(
      screen.getByTestId("team-flagship").getAttribute("data-variant"),
    ).toBe("b");
  });

  it("shows the photo state when teamImageUrl is provided", () => {
    render(
      <TeamFlagship
        variant="a"
        kicker="Eerste elftal"
        category="A-ploeg"
        teamImageUrl="/fixtures/a.jpg"
        href="/x"
      />,
    );
    expect(
      screen.getByTestId("team-flagship-photo").getAttribute("data-state"),
    ).toBe("photo");
  });

  it("falls back to the jersey state when no photo", () => {
    render(
      <TeamFlagship
        variant="a"
        kicker="Eerste elftal"
        category="A-ploeg"
        href="/x"
      />,
    );
    expect(
      screen.getByTestId("team-flagship-photo").getAttribute("data-state"),
    ).toBe("jersey");
  });

  it("omits the meta line when division and season are both absent", () => {
    render(
      <TeamFlagship
        variant="b"
        kicker="Tweede elftal"
        category="B-ploeg"
        href="/x"
      />,
    );
    const flagship = screen.getByTestId("team-flagship");
    expect(flagship.textContent).not.toContain("·");
  });
});

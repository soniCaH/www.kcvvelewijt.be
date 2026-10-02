/**
 * PersonCardRun unit tests.
 *
 * Covers:
 *  - `label` drives both the section's accessible name and the visible
 *    mono-caps heading text
 *  - Children render inside the grid
 *  - The grid track is the single, canonical `minmax(140px,1fr)` string
 *    (#2477 "One grid" — this is now the one place it lives)
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PersonCardRun } from "./PersonCardRun";

describe("PersonCardRun", () => {
  it("renders the label as a level-3 heading", () => {
    render(
      <PersonCardRun label="Doelmannen">
        <div>card</div>
      </PersonCardRun>,
    );
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(
      "Doelmannen",
    );
  });

  it("sets the run label in the text-label step, not an arbitrary size and tracking (#3334)", () => {
    render(
      <PersonCardRun label="Doelmannen">
        <div>card</div>
      </PersonCardRun>,
    );
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveClass("text-label");
    expect(heading.className).not.toMatch(/text-\[|tracking-\[/);
  });

  it("names the region after the label", () => {
    render(
      <PersonCardRun label="Doelmannen">
        <div>card</div>
      </PersonCardRun>,
    );
    expect(
      screen.getByRole("region", { name: "Doelmannen" }),
    ).toBeInTheDocument();
  });

  it("renders its children inside the grid", () => {
    render(
      <PersonCardRun label="Staf">
        <div data-testid="child">card</div>
      </PersonCardRun>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("forwards data-testid to the grid element", () => {
    render(
      <PersonCardRun label="Staf" data-testid="my-grid">
        <div>card</div>
      </PersonCardRun>,
    );
    expect(screen.getByTestId("my-grid")).toBeInTheDocument();
  });

  it("uses the canonical auto-fill minmax(140px,1fr) grid track — the single source of truth (#2477)", () => {
    render(
      <PersonCardRun label="Staf" data-testid="my-grid">
        <div>card</div>
      </PersonCardRun>,
    );
    expect(
      screen.getByTestId("my-grid").className.replace(/\s+/g, " "),
    ).toContain("grid-cols-[repeat(auto-fill,minmax(140px,1fr))]");
  });

  it("suppresses the visible heading and the run's own region name when hideHeading is set, so the host's named section is not listed twice (#2638, #3334)", () => {
    render(
      <PersonCardRun label="Spelers" hideHeading>
        <div>card</div>
      </PersonCardRun>,
    );
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
    expect(screen.queryByRole("region", { name: "Spelers" })).toBeNull();
    expect(screen.queryByRole("region")).toBeNull();
  });
});

/**
 * SearchMasthead Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchMasthead } from "./SearchMasthead";

describe("SearchMasthead", () => {
  it("renders the level-1 search prompt heading", () => {
    render(
      <SearchMasthead>
        <div>field</div>
      </SearchMasthead>,
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Wat zoek je?");
  });

  it("renders the accent word as a warm-gold emphasis", () => {
    render(
      <SearchMasthead>
        <div>field</div>
      </SearchMasthead>,
    );

    const accent = screen.getByText("zoek");
    expect(accent.tagName).toBe("EM");
    expect(accent.className).toContain("text-warm");
  });

  it("renders the field slot", () => {
    render(
      <SearchMasthead>
        <div data-testid="field">field</div>
      </SearchMasthead>,
    );

    expect(screen.getByTestId("field")).toBeInTheDocument();
  });

  it("renders the persistent mono hint line", () => {
    render(
      <SearchMasthead>
        <div>field</div>
      </SearchMasthead>,
    );

    expect(screen.getByText(/typ minstens 2 letters/i)).toBeInTheDocument();
  });

  it("supports custom heading, accent and hint", () => {
    render(
      <SearchMasthead heading="Zoek iets" accent="iets" hint="Custom hint">
        <div>field</div>
      </SearchMasthead>,
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Zoek iets.");
    expect(screen.getByText("iets").tagName).toBe("EM");
    expect(screen.getByText("Custom hint")).toBeInTheDocument();
  });
});

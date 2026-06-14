/**
 * SearchPreSearchCard Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchPreSearchCard } from "./SearchPreSearchCard";

describe("SearchPreSearchCard", () => {
  it("renders the helper prompt heading", () => {
    render(<SearchPreSearchCard />);

    // "beginnen" is rendered as an emphasis span, so the heading's own text
    // node is "Niet zeker waar te …?".
    expect(screen.getByText(/niet zeker waar te/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /niet zeker waar te beginnen/i }),
    ).toBeInTheDocument();
  });

  it("frames the chips as examples", () => {
    render(<SearchPreSearchCard />);

    expect(screen.getByText(/zoek bijvoorbeeld naar/i)).toBeInTheDocument();
  });

  it("renders the three mono example chips", () => {
    render(<SearchPreSearchCard />);

    expect(screen.getByText("Een spelersnaam")).toBeInTheDocument();
    expect(screen.getByText("Een ploeg")).toBeInTheDocument();
    expect(screen.getByText("Een nieuwsbericht")).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HistoryContent } from "./HistoryContent";

describe("HistoryContent", () => {
  it("renders PageHero with history content", () => {
    render(<HistoryContent />);

    expect(screen.getByText("Onze club")).toBeInTheDocument();
    expect(
      screen.getByText(/meer dan een eeuw voetbalpassie/i),
    ).toBeInTheDocument();
  });

  it("renders timeline sections", () => {
    render(<HistoryContent />);

    expect(screen.getByText("1909 - 1935")).toBeInTheDocument();
    expect(screen.getByText("2025 - ...")).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HistoryContent } from "./HistoryContent";

describe("HistoryContent", () => {
  it("renders InteriorPageHero with the Onze club label", () => {
    render(<HistoryContent />);
    expect(screen.getByText("Onze club")).toBeInTheDocument();
    expect(
      screen.getByText(/meer dan een eeuw voetbalpassie/i),
    ).toBeInTheDocument();
  });

  it("renders timeline content inside the max-w-5xl container", () => {
    const { container } = render(<HistoryContent />);
    const wrapper = container.querySelector(".max-w-5xl");
    expect(wrapper).not.toBeNull();
  });

  it("renders the first and last timeline dates", () => {
    render(<HistoryContent />);
    expect(screen.getByText("1909 - 1935")).toBeInTheDocument();
    expect(screen.getByText("2025 - ...")).toBeInTheDocument();
  });

  it("renders the closing SectionCta with a Word lid button", () => {
    render(<HistoryContent />);
    expect(
      screen.getByRole("heading", { name: /maak deel uit van ons verhaal/i }),
    ).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /word lid/i });
    expect(cta).toHaveAttribute("href", "/hulp");
  });
});

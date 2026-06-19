import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HistoryContent } from "./HistoryContent";

describe("HistoryContent", () => {
  it("renders the heritage hero kicker and headline", () => {
    render(<HistoryContent />);
    expect(screen.getByText("De club · sinds 1909")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /meer dan een eeuw/i }),
    ).toBeInTheDocument();
  });

  it("renders the timeline content inside the page body container", () => {
    render(<HistoryContent />);
    // Anchor on actual timeline content. Both hero and timeline now use
    // <PageContainer> (max-w-[var(--container-wide)]); match its width token.
    const firstTimelineDate = screen.getByText("1909 - 1935");
    expect(
      firstTimelineDate.closest('[class*="--container-wide"]'),
    ).not.toBeNull();
  });

  it("renders the first and last timeline dates as chips", () => {
    render(<HistoryContent />);
    expect(screen.getByText("1909 - 1935")).toBeInTheDocument();
    expect(screen.getByText("2025 - ...")).toBeInTheDocument();
  });

  it("renders the credits attribution", () => {
    render(<HistoryContent />);
    expect(
      screen.getByRole("heading", { name: /credits/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/martijn van den berg/i)).toBeInTheDocument();
  });

  it("does not render any retired legacy CTA copy", () => {
    render(<HistoryContent />);
    expect(
      screen.queryByText(/maak deel uit van ons verhaal/i),
    ).not.toBeInTheDocument();
  });
});

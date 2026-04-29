/**
 * MatchStatusBadge Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MatchStatusBadge } from "./MatchStatusBadge";

describe("MatchStatusBadge", () => {
  it("renders 'Uitgesteld' for postponed status", () => {
    render(<MatchStatusBadge status="postponed" />);
    expect(screen.getByText("Uitgesteld")).toBeInTheDocument();
  });

  it("renders 'Gestopt' for stopped status", () => {
    render(<MatchStatusBadge status="stopped" />);
    expect(screen.getByText("Gestopt")).toBeInTheDocument();
  });

  it("renders 'FF' for forfeited status", () => {
    render(<MatchStatusBadge status="forfeited" />);
    expect(screen.getByText("FF")).toBeInTheDocument();
  });

  it("renders nothing for scheduled status", () => {
    const { container } = render(<MatchStatusBadge status="scheduled" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing for finished status", () => {
    const { container } = render(<MatchStatusBadge status="finished" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing for unknown string status", () => {
    const { container } = render(<MatchStatusBadge status="toString" />);
    expect(container.innerHTML).toBe("");
  });

  it("postponed maps to a pill-jersey MonoLabel variant", () => {
    // postponed → orange → pill-jersey (Phase 1 migration; was BadgeVariant 'warning')
    const { container } = render(<MatchStatusBadge status="postponed" />);
    expect(
      container.querySelector('[data-variant="pill-jersey"]'),
    ).not.toBeNull();
  });

  it("forfeited maps to a pill-cream MonoLabel variant", () => {
    // forfeited → gray → pill-cream
    const { container } = render(<MatchStatusBadge status="forfeited" />);
    expect(
      container.querySelector('[data-variant="pill-cream"]'),
    ).not.toBeNull();
  });

  it("applies custom className to the wrapping span", () => {
    const { container } = render(
      <MatchStatusBadge status="postponed" className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

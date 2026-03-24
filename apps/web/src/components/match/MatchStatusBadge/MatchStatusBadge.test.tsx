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

  it("uses getStatusColor to determine badge variant", () => {
    // postponed → orange → warning variant
    const { container } = render(<MatchStatusBadge status="postponed" />);
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("warning");
  });

  it("applies custom className", () => {
    const { container } = render(
      <MatchStatusBadge status="postponed" className="custom-class" />,
    );
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("custom-class");
  });
});

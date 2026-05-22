import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MatchStatusBadge } from "./MatchStatusBadge";

describe("MatchStatusBadge", () => {
  describe("rendering statuses", () => {
    it("renders 'FT' with Voltijd tooltip + cream tint for finished", () => {
      render(<MatchStatusBadge status="finished" />);
      const badge = screen.getByText("FT");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("title", "Voltijd");
      expect(badge.className).toContain("bg-cream");
    });

    it("renders 'FF' with Forfait tooltip + cream-deep tint for forfeited", () => {
      render(<MatchStatusBadge status="forfeited" />);
      const badge = screen.getByText("FF");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("title", "Forfait");
      expect(badge.className).toContain("bg-cream-deep");
    });

    it("renders 'PP' with Uitgesteld tooltip + cream-deep tint for postponed", () => {
      render(<MatchStatusBadge status="postponed" />);
      const badge = screen.getByText("PP");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("title", "Uitgesteld");
      expect(badge.className).toContain("bg-cream-deep");
    });

    it("renders 'CANC' with Geannuleerd tooltip + card-red tint + cream text for cancelled", () => {
      render(<MatchStatusBadge status="cancelled" />);
      const badge = screen.getByText("CANC");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("title", "Geannuleerd");
      expect(badge.className).toContain("bg-card-red");
      expect(badge.className).toContain("text-cream");
    });

    it("renders 'STOP' with Gestopt tooltip + warm tint + ink text for stopped", () => {
      render(<MatchStatusBadge status="stopped" />);
      const badge = screen.getByText("STOP");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("title", "Gestopt");
      expect(badge.className).toContain("bg-warm");
      expect(badge.className).toContain("text-ink");
    });
  });

  describe("non-rendering statuses", () => {
    it("renders nothing for scheduled status", () => {
      const { container } = render(<MatchStatusBadge status="scheduled" />);
      expect(container.innerHTML).toBe("");
    });

    it("renders nothing for unknown string status", () => {
      const { container } = render(<MatchStatusBadge status="not-a-status" />);
      expect(container.innerHTML).toBe("");
    });
  });

  describe("chrome", () => {
    it("applies Direction-D paper-chrome base classes", () => {
      render(<MatchStatusBadge status="finished" />);
      const badge = screen.getByText("FT");
      expect(badge.className).toContain("border-2");
      expect(badge.className).toContain("border-ink");
      expect(badge.className).toContain("shadow-paper-sm");
      expect(badge.className).toContain("font-mono");
      expect(badge.className).toContain("uppercase");
    });

    it("applies custom className to the badge", () => {
      render(<MatchStatusBadge status="finished" className="rotate-[-2deg]" />);
      expect(screen.getByText("FT")).toHaveClass("rotate-[-2deg]");
    });
  });
});

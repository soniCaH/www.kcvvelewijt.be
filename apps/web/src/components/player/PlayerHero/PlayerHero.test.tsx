/**
 * PlayerHero Component Tests
 *
 * Covers:
 *  - Name rhythm: first name in upright Black display + last name italic + period suffix (6.d1).
 *  - Photo / illustration fallback branch (6.d2).
 *  - Age-graded birthDate meta (6.d9):
 *      - adult (≥18) → `DD·MM·YYYY` literal
 *      - minor (<18) → `<age> jaar · '<YY>`
 *  - No `<MonoLabel>NIEUW</MonoLabel>` (dropped at 6.d3).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayerHero } from "./PlayerHero";

describe("PlayerHero", () => {
  // Pin "now" to 2026-05-21 so age math is deterministic in tests + VR.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Name rhythm (6.d1)", () => {
    it("renders the first name with upright Black display weight", () => {
      render(
        <PlayerHero
          firstName="Maxim"
          lastName="Breugelmans"
          position="Middenvelder"
        />,
      );
      const first = screen.getByTestId("player-hero-first-name");
      expect(first.textContent).toBe("Maxim");
      expect(first.className).toContain("font-display");
      expect(first.className).toContain("font-black");
      expect(first.className).not.toContain("italic");
    });

    it("renders the last name in italic display weight with a trailing period", () => {
      render(
        <PlayerHero
          firstName="Maxim"
          lastName="Breugelmans"
          position="Middenvelder"
        />,
      );
      const last = screen.getByTestId("player-hero-last-name");
      expect(last.textContent).toBe("Breugelmans.");
      expect(last.className).toContain("font-display");
      expect(last.className).toContain("italic");
    });

    it("survives a long Dutch family name (Van den Broeck) without crashing", () => {
      render(
        <PlayerHero
          firstName="Joachim"
          lastName="Van den Broeck"
          position="Verdediger"
        />,
      );
      expect(screen.getByTestId("player-hero-last-name").textContent).toBe(
        "Van den Broeck.",
      );
    });
  });

  describe("Hero photo / illustration fallback (6.d2)", () => {
    it("renders the photo state when photoUrl is provided", () => {
      render(
        <PlayerHero
          firstName="Maxim"
          lastName="Breugelmans"
          position="Middenvelder"
          photoUrl="/test-fixtures/maxim.webp"
        />,
      );
      const figure = screen.getByTestId("player-hero-figure");
      expect(figure.getAttribute("data-state")).toBe("photo");
      expect(screen.queryByTestId("player-hero-illustration")).toBeNull();
    });

    it("renders the illustration fallback when photoUrl is missing", () => {
      render(
        <PlayerHero
          firstName="Maxim"
          lastName="Breugelmans"
          position="Middenvelder"
        />,
      );
      const figure = screen.getByTestId("player-hero-figure");
      expect(figure.getAttribute("data-state")).toBe("illustration");
      expect(
        screen.getByTestId("player-hero-illustration"),
      ).toBeInTheDocument();
    });
  });

  describe("Age-graded meta row (6.d9)", () => {
    it("renders full DD·MM·YYYY for adults (≥18)", () => {
      render(
        <PlayerHero
          firstName="Maxim"
          lastName="Breugelmans"
          position="Middenvelder"
          // 27 years old at 2026-05-21.
          birthDate="1999-03-14"
        />,
      );
      const meta = screen.getByTestId("player-hero-meta");
      expect(meta.textContent).toContain("14·03·1999");
      expect(meta.textContent).not.toContain("jaar");
    });

    it("renders `<age> jaar · 'YY` for minors (<18)", () => {
      render(
        <PlayerHero
          firstName="Sem"
          lastName="De Witte"
          position="Aanvaller"
          // U17 — born 2009-09-12, age 16 on 2026-05-21.
          birthDate="2009-09-12"
        />,
      );
      const meta = screen.getByTestId("player-hero-meta");
      expect(meta.textContent).toContain("16 jaar");
      expect(meta.textContent).toContain("'09");
      expect(meta.textContent).not.toContain("12·09·2009");
    });

    it("treats players turning 18 today as adults (≥18 inclusive)", () => {
      render(
        <PlayerHero
          firstName="Jonas"
          lastName="Peeters"
          position="Middenvelder"
          birthDate="2008-05-21"
        />,
      );
      const meta = screen.getByTestId("player-hero-meta");
      expect(meta.textContent).toContain("21·05·2008");
    });

    it("omits the birthDate cell when no birthDate is supplied", () => {
      render(
        <PlayerHero
          firstName="Maxim"
          lastName="Breugelmans"
          position="Middenvelder"
        />,
      );
      const meta = screen.getByTestId("player-hero-meta");
      expect(meta.textContent).toContain("Middenvelder");
      expect(meta.textContent ?? "").not.toMatch(/\d{4}/);
      expect(meta.textContent ?? "").not.toContain("jaar");
    });
  });

  describe("Numeric + ticket-stub composition", () => {
    it("renders the jersey number when provided", () => {
      render(
        <PlayerHero
          firstName="Maxim"
          lastName="Breugelmans"
          position="Middenvelder"
          jerseyNumber={8}
        />,
      );
      expect(screen.getByTestId("player-hero-number").textContent).toContain(
        "8",
      );
    });

    it("renders the ticket-stub when team + season are provided", () => {
      render(
        <PlayerHero
          firstName="Maxim"
          lastName="Breugelmans"
          position="Middenvelder"
          teamLabel="A-Ploeg"
          season="26/27"
        />,
      );
      const stub = screen.getByTestId("player-hero-ticket-stub");
      expect(stub.textContent).toContain("A-Ploeg");
      expect(stub.textContent).toContain("26/27");
    });

    it("omits the ticket-stub when both team and season are missing", () => {
      render(
        <PlayerHero
          firstName="Maxim"
          lastName="Breugelmans"
          position="Middenvelder"
        />,
      );
      expect(screen.queryByTestId("player-hero-ticket-stub")).toBeNull();
    });
  });

  describe("NIEUW badge dropped (6.d3)", () => {
    it("never renders a NIEUW badge", () => {
      render(
        <PlayerHero
          firstName="Maxim"
          lastName="Breugelmans"
          position="Middenvelder"
          photoUrl="/test-fixtures/maxim.webp"
        />,
      );
      expect(screen.queryByText("NIEUW")).toBeNull();
    });
  });
});

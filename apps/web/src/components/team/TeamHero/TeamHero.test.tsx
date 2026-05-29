/**
 * TeamHero Component Tests
 *
 * Covers:
 *  - Kicker: "KCVV Elewijt" for senior, "KCVV Elewijt · Jeugd" for youth.
 *  - Headline: category label with period (A-ploeg. / B-ploeg. / U13.).
 *  - Meta row: division + season pills for senior; youth band + season for youth.
 *  - Meta auto-hide when both pills absent.
 *  - Tagline renders and auto-hides.
 *  - Artefact state: "photo" when teamImageUrl present, "jersey" fallback when absent.
 *  - Season stub renders when season present, hides when absent.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamHero } from "./TeamHero";

const BASE_SENIOR = {
  age: "A" as const,
  teamType: "senior" as const,
  divisionFull: "Eerste Elftal A – 3e Nat. A",
  season: "25/26",
};

describe("TeamHero", () => {
  describe("Kicker", () => {
    it("renders 'KCVV Elewijt' for a senior team", () => {
      render(<TeamHero {...BASE_SENIOR} />);
      expect(screen.getByTestId("team-hero-kicker").textContent).toBe(
        "KCVV Elewijt",
      );
    });

    it("renders 'KCVV Elewijt · Jeugd' for a youth team", () => {
      render(
        <TeamHero age="U13" teamType="youth" ageGroup="U13" season="25/26" />,
      );
      expect(screen.getByTestId("team-hero-kicker").textContent).toBe(
        "KCVV Elewijt · Jeugd",
      );
    });
  });

  describe("Headline / category", () => {
    it("renders 'A-ploeg.' as the h1 for age A senior", () => {
      render(<TeamHero {...BASE_SENIOR} />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1.textContent).toBe("A-ploeg.");
    });

    it("renders 'B-ploeg.' for age B senior", () => {
      render(<TeamHero age="B" teamType="senior" season="25/26" />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1.textContent).toBe("B-ploeg.");
    });

    it("renders 'U13.' for a U13 youth team", () => {
      render(
        <TeamHero age="U13" teamType="youth" ageGroup="U13" season="25/26" />,
      );
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1.textContent).toBe("U13.");
    });

    it("renders 'U17.' for a U17 youth team", () => {
      render(
        <TeamHero age="U17" teamType="youth" ageGroup="U17" season="25/26" />,
      );
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1.textContent).toBe("U17.");
    });
  });

  describe("Meta row (pills)", () => {
    it("shows division and season pills for a senior team with data", () => {
      render(<TeamHero {...BASE_SENIOR} />);
      const meta = screen.getByTestId("team-hero-meta");
      expect(meta.textContent).toContain("Eerste Elftal A – 3e Nat. A");
      expect(meta.textContent).toContain("25/26");
    });

    it("falls back to short division when divisionFull is absent", () => {
      render(
        <TeamHero age="A" teamType="senior" division="3NA" season="25/26" />,
      );
      const meta = screen.getByTestId("team-hero-meta");
      expect(meta.textContent).toContain("3NA");
    });

    it("shows youth band and season for a youth team", () => {
      render(
        <TeamHero age="U13" teamType="youth" ageGroup="U13" season="25/26" />,
      );
      const meta = screen.getByTestId("team-hero-meta");
      expect(meta.textContent).toContain("Middenbouw");
      expect(meta.textContent).toContain("25/26");
    });

    it("shows Bovenbouw band for U17", () => {
      render(
        <TeamHero age="U17" teamType="youth" ageGroup="U17" season="25/26" />,
      );
      expect(screen.getByTestId("team-hero-meta").textContent).toContain(
        "Bovenbouw",
      );
    });

    it("shows Onderbouw band for U9", () => {
      render(
        <TeamHero age="U9" teamType="youth" ageGroup="U9" season="25/26" />,
      );
      expect(screen.getByTestId("team-hero-meta").textContent).toContain(
        "Onderbouw",
      );
    });

    it("auto-hides meta row when no division and no season", () => {
      render(<TeamHero age="A" teamType="senior" />);
      expect(screen.queryByTestId("team-hero-meta")).toBeNull();
    });
  });

  describe("Tagline", () => {
    it("renders the tagline when provided", () => {
      render(
        <TeamHero {...BASE_SENIOR} tagline="Sterk, gedreven, één ploeg." />,
      );
      expect(screen.getByTestId("team-hero-tagline").textContent).toBe(
        "Sterk, gedreven, één ploeg.",
      );
    });

    it("auto-hides the tagline when absent", () => {
      render(<TeamHero {...BASE_SENIOR} />);
      expect(screen.queryByTestId("team-hero-tagline")).toBeNull();
    });
  });

  describe("Artefact state (photo vs JerseyShirt fallback)", () => {
    it("sets data-state='photo' when teamImageUrl is provided", () => {
      render(
        <TeamHero {...BASE_SENIOR} teamImageUrl="/fixtures/ploeg-a.jpg" />,
      );
      expect(
        screen.getByTestId("team-hero-artefact").getAttribute("data-state"),
      ).toBe("photo");
    });

    it("sets data-state='jersey' when teamImageUrl is absent", () => {
      render(<TeamHero {...BASE_SENIOR} />);
      expect(
        screen.getByTestId("team-hero-artefact").getAttribute("data-state"),
      ).toBe("jersey");
    });
  });

  describe("Season stub", () => {
    it("renders the season stub when season is provided", () => {
      render(<TeamHero {...BASE_SENIOR} />);
      expect(screen.getByTestId("team-hero-season-stub")).toBeInTheDocument();
      expect(screen.getByTestId("team-hero-season-stub").textContent).toContain(
        "25/26",
      );
    });

    it("hides the season stub when season is absent", () => {
      render(<TeamHero age="A" teamType="senior" />);
      expect(screen.queryByTestId("team-hero-season-stub")).toBeNull();
    });
  });
});

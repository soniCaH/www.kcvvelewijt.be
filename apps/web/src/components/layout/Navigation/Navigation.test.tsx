/**
 * Navigation Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Navigation } from "./Navigation";

// Mock variables to control test behavior
let mockPathname = "/";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

import type { TeamNavVM } from "@/lib/repositories/team.repository";

const seniorTeams: TeamNavVM[] = [
  {
    id: "a-id",
    name: "Eerste Elftallen A",
    slug: "eerste-elftallen-a",
    age: "A",
    psdId: "100",
    division: null,
    divisionFull: null,
    tagline: null,
    teamImageUrl: null,
  },
  {
    id: "b-id",
    name: "Eerste Elftallen B",
    slug: "eerste-elftallen-b",
    age: "A",
    psdId: "101",
    division: null,
    divisionFull: null,
    tagline: null,
    teamImageUrl: null,
  },
];

describe("Navigation", () => {
  beforeEach(() => {
    mockPathname = "/";
    mockSearchParams = new URLSearchParams();
  });

  describe("Rendering", () => {
    it("should render navigation element", () => {
      render(<Navigation seniorTeams={seniorTeams} />);
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should render all main menu items", () => {
      render(<Navigation seniorTeams={seniorTeams} />);
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Nieuws")).toBeInTheDocument();
      expect(screen.getByText("A-Ploeg")).toBeInTheDocument();
      expect(screen.getByText("B-Ploeg")).toBeInTheDocument();
    });
  });

  describe("Active state detection", () => {
    it("should mark Home as active on root path", () => {
      mockPathname = "/";
      render(<Navigation seniorTeams={seniorTeams} />);
      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).toHaveClass("active");
    });

    it("should mark Nieuws as active on /nieuws path", () => {
      mockPathname = "/nieuws";
      render(<Navigation seniorTeams={seniorTeams} />);
      const newsLink = screen.getByText("Nieuws").closest("a");
      expect(newsLink).toHaveClass("active");
    });

    it("should not mark base path as active when tab param exists", async () => {
      mockPathname = "/ploegen/eerste-elftallen-a";
      mockSearchParams = new URLSearchParams("tab=opstelling");
      const { container } = render(<Navigation seniorTeams={seniorTeams} />);

      // A-Ploeg is a dropdown trigger - it should NOT have the "active" class
      const aPloegTrigger = screen.getByText("A-Ploeg").closest("a");
      expect(aPloegTrigger).toBeInTheDocument();
      expect(aPloegTrigger).toHaveClass("dropdown-trigger");
      expect(aPloegTrigger).not.toHaveClass("active");

      // Hover to open dropdown using fireEvent
      const aPloegListItem = screen.getByText("A-Ploeg").closest("li");
      expect(aPloegListItem).toBeInTheDocument();
      fireEvent.mouseEnter(aPloegListItem!);

      // Wait for dropdown to render
      await waitFor(() => {
        const lineupLink = container.querySelector(
          'a[href="/ploegen/eerste-elftallen-a?tab=opstelling"]',
        );
        expect(lineupLink).toBeInTheDocument();
      });

      // The "Spelers & Staff" link (tab=opstelling) should be active
      const lineupLink = container.querySelector(
        'a[href="/ploegen/eerste-elftallen-a?tab=opstelling"]',
      );
      expect(lineupLink).toHaveClass("text-kcvv-green-bright");
    });
  });

  describe("Query parameter active state", () => {
    it("should mark dropdown item as active when pathname and tab param match", async () => {
      mockPathname = "/ploegen/eerste-elftallen-a";
      mockSearchParams = new URLSearchParams("tab=opstelling");
      const { container } = render(<Navigation seniorTeams={seniorTeams} />);

      // Hover over the A-Ploeg dropdown to open it using fireEvent
      const aPloegListItem = screen.getByText("A-Ploeg").closest("li");
      expect(aPloegListItem).toBeInTheDocument();
      fireEvent.mouseEnter(aPloegListItem!);

      // Wait for dropdown to render
      await waitFor(() => {
        const spelersLink = container.querySelector(
          'a[href="/ploegen/eerste-elftallen-a?tab=opstelling"]',
        );
        expect(spelersLink).toBeInTheDocument();
      });

      // The "Spelers & Staff" link should be active (has ?tab=opstelling)
      const spelersLink = container.querySelector(
        'a[href="/ploegen/eerste-elftallen-a?tab=opstelling"]',
      );
      expect(spelersLink).toHaveClass("text-kcvv-green-bright");
    });

    it("should mark Info as active when on team page without tab param", async () => {
      mockPathname = "/ploegen/eerste-elftallen-a";
      mockSearchParams = new URLSearchParams();
      const { container } = render(<Navigation seniorTeams={seniorTeams} />);

      // Hover over the A-Ploeg dropdown to open it using fireEvent
      const aPloegListItem = screen.getByText("A-Ploeg").closest("li");
      expect(aPloegListItem).toBeInTheDocument();
      fireEvent.mouseEnter(aPloegListItem!);

      // Wait for dropdown to render with multiple info links
      await waitFor(() => {
        const infoLinks = container.querySelectorAll(
          'a[href="/ploegen/eerste-elftallen-a"]',
        );
        expect(infoLinks.length).toBeGreaterThan(1);
      });

      // The "Info" link in the dropdown should be active (no tab param)
      // It's the second link with this href (first is the dropdown trigger)
      const infoLinks = container.querySelectorAll(
        'a[href="/ploegen/eerste-elftallen-a"]',
      );
      // The dropdown child link (second one) should be green
      const dropdownInfoLink = infoLinks[1];
      expect(dropdownInfoLink).toHaveClass("text-kcvv-green-bright");
    });

    it("should mark Info as active when tab param exists on same path", async () => {
      mockPathname = "/ploegen/eerste-elftallen-a";
      mockSearchParams = new URLSearchParams("tab=wedstrijden");
      const { container } = render(<Navigation seniorTeams={seniorTeams} />);

      // Hover over the A-Ploeg dropdown to open it using fireEvent
      const aPloegListItem = screen.getByText("A-Ploeg").closest("li");
      expect(aPloegListItem).toBeInTheDocument();
      fireEvent.mouseEnter(aPloegListItem!);

      // Wait for dropdown to render
      await waitFor(() => {
        const infoLinks = container.querySelectorAll(
          'a[href="/ploegen/eerste-elftallen-a"]',
        );
        expect(infoLinks.length).toBeGreaterThan(1);
      });

      // The dropdown "Info" link should be active — it's the parent of the tabbed page
      const infoLinks = container.querySelectorAll(
        'a[href="/ploegen/eerste-elftallen-a"]',
      );
      const dropdownInfoLink = infoLinks[1];
      expect(dropdownInfoLink).toHaveClass("text-kcvv-green-bright");
    });
  });

  describe("Nested routes", () => {
    it("should mark parent as active for nested routes", async () => {
      mockPathname = "/club/geschiedenis";
      const { container } = render(<Navigation seniorTeams={seniorTeams} />);

      // "De club" is a dropdown trigger - hover to open it
      const deClubListItem = screen.getByText("De club").closest("li");
      expect(deClubListItem).toBeInTheDocument();
      fireEvent.mouseEnter(deClubListItem!);

      // Wait for dropdown to render
      await waitFor(() => {
        const historyLink = container.querySelector(
          'a[href="/club/geschiedenis"]',
        );
        expect(historyLink).toBeInTheDocument();
      });

      // The "Geschiedenis" link (/club/geschiedenis) should be active due to exact match
      const historyLink = container.querySelector(
        'a[href="/club/geschiedenis"]',
      );
      expect(historyLink).toHaveClass("text-kcvv-green-bright");
    });
  });

  describe("No inline style blocks", () => {
    it("should not render any inline <style> elements", () => {
      const { container } = render(<Navigation seniorTeams={seniorTeams} />);
      const styleElements = container.querySelectorAll("style");
      expect(styleElements).toHaveLength(0);
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      render(<Navigation seniorTeams={seniorTeams} className="custom-class" />);
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("custom-class");
    });
  });
});

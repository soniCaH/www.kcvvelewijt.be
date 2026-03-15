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

const seniorTeams = [
  {
    _id: "a-id",
    name: "Eerste Elftallen A",
    slug: "eerste-elftallen-a",
    age: "A",
  },
  {
    _id: "b-id",
    name: "Eerste Elftallen B",
    slug: "eerste-elftallen-b",
    age: "A",
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

    it("should mark Nieuws as active on /news path", () => {
      mockPathname = "/news";
      render(<Navigation seniorTeams={seniorTeams} />);
      const newsLink = screen.getByText("Nieuws").closest("a");
      expect(newsLink).toHaveClass("active");
    });

    it("should not mark base path as active when tab param exists", async () => {
      mockPathname = "/team/eerste-elftallen-a";
      mockSearchParams = new URLSearchParams("tab=lineup");
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
          'a[href="/team/eerste-elftallen-a?tab=lineup"]',
        );
        expect(lineupLink).toBeInTheDocument();
      });

      // The "Spelers & Staff" link (tab=lineup) should be active
      const lineupLink = container.querySelector(
        'a[href="/team/eerste-elftallen-a?tab=lineup"]',
      );
      expect(lineupLink).toHaveClass("text-kcvv-green-bright");
    });
  });

  describe("Query parameter active state", () => {
    it("should mark dropdown item as active when pathname and tab param match", async () => {
      mockPathname = "/team/eerste-elftallen-a";
      mockSearchParams = new URLSearchParams("tab=lineup");
      const { container } = render(<Navigation seniorTeams={seniorTeams} />);

      // Hover over the A-Ploeg dropdown to open it using fireEvent
      const aPloegListItem = screen.getByText("A-Ploeg").closest("li");
      expect(aPloegListItem).toBeInTheDocument();
      fireEvent.mouseEnter(aPloegListItem!);

      // Wait for dropdown to render
      await waitFor(() => {
        const spelersLink = container.querySelector(
          'a[href="/team/eerste-elftallen-a?tab=lineup"]',
        );
        expect(spelersLink).toBeInTheDocument();
      });

      // The "Spelers & Staff" link should be active (has ?tab=lineup)
      const spelersLink = container.querySelector(
        'a[href="/team/eerste-elftallen-a?tab=lineup"]',
      );
      expect(spelersLink).toHaveClass("text-kcvv-green-bright");
    });

    it("should mark Info as active when on team page without tab param", async () => {
      mockPathname = "/team/eerste-elftallen-a";
      mockSearchParams = new URLSearchParams();
      const { container } = render(<Navigation seniorTeams={seniorTeams} />);

      // Hover over the A-Ploeg dropdown to open it using fireEvent
      const aPloegListItem = screen.getByText("A-Ploeg").closest("li");
      expect(aPloegListItem).toBeInTheDocument();
      fireEvent.mouseEnter(aPloegListItem!);

      // Wait for dropdown to render with multiple info links
      await waitFor(() => {
        const infoLinks = container.querySelectorAll(
          'a[href="/team/eerste-elftallen-a"]',
        );
        expect(infoLinks.length).toBeGreaterThan(1);
      });

      // The "Info" link in the dropdown should be active (no tab param)
      // It's the second link with this href (first is the dropdown trigger)
      const infoLinks = container.querySelectorAll(
        'a[href="/team/eerste-elftallen-a"]',
      );
      // The dropdown child link (second one) should be green
      const dropdownInfoLink = infoLinks[1];
      expect(dropdownInfoLink).toHaveClass("text-kcvv-green-bright");
    });

    it("should not mark Info as active when tab param exists", async () => {
      mockPathname = "/team/eerste-elftallen-a";
      mockSearchParams = new URLSearchParams("tab=matches");
      const { container } = render(<Navigation seniorTeams={seniorTeams} />);

      // Hover over the A-Ploeg dropdown to open it using fireEvent
      const aPloegListItem = screen.getByText("A-Ploeg").closest("li");
      expect(aPloegListItem).toBeInTheDocument();
      fireEvent.mouseEnter(aPloegListItem!);

      // Wait for dropdown to render
      await waitFor(() => {
        const infoLinks = container.querySelectorAll(
          'a[href="/team/eerste-elftallen-a"]',
        );
        expect(infoLinks.length).toBeGreaterThan(1);
      });

      // The dropdown "Info" link should NOT be active when we're on ?tab=matches
      // Get all links with this href - [0] is trigger, [1] is dropdown item
      const infoLinks = container.querySelectorAll(
        'a[href="/team/eerste-elftallen-a"]',
      );
      const dropdownInfoLink = infoLinks[1];
      expect(dropdownInfoLink).not.toHaveClass("text-kcvv-green-bright");
    });
  });

  describe("Nested routes", () => {
    it("should mark parent as active for nested routes", async () => {
      mockPathname = "/club/history";
      const { container } = render(<Navigation seniorTeams={seniorTeams} />);

      // "De club" is a dropdown trigger - hover to open it
      const deClubListItem = screen.getByText("De club").closest("li");
      expect(deClubListItem).toBeInTheDocument();
      fireEvent.mouseEnter(deClubListItem!);

      // Wait for dropdown to render
      await waitFor(() => {
        const historyLink = container.querySelector('a[href="/club/history"]');
        expect(historyLink).toBeInTheDocument();
      });

      // The "Geschiedenis" link (/club/history) should be active due to exact match
      const historyLink = container.querySelector('a[href="/club/history"]');
      expect(historyLink).toHaveClass("text-kcvv-green-bright");
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

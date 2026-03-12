/**
 * MobileMenu Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ImageProps } from "next/image";
import { MobileMenu } from "./MobileMenu";

// Mock variables to control test behavior
let mockPathname = "/";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

const mockYouthTeams = [
  { _id: "1", name: "KCVV U21", slug: "kcvv-elewijt-u21", age: "U21" },
  { _id: "2", name: "KCVV U17", slug: "kcvv-elewijt-u17", age: "U17" },
];

const mockSeniorTeams = [
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
    age: "B",
  },
];

describe("MobileMenu", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    youthTeams: mockYouthTeams,
    seniorTeams: mockSeniorTeams,
  };

  beforeEach(() => {
    mockPathname = "/";
    mockSearchParams = new URLSearchParams();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render when open", () => {
      render(<MobileMenu {...defaultProps} />);
      expect(
        screen.getByRole("navigation", { name: /mobile navigation/i }),
      ).toBeInTheDocument();
    });

    it("should render close button", () => {
      render(<MobileMenu {...defaultProps} />);
      expect(screen.getByLabelText(/close menu/i)).toBeInTheDocument();
    });

    it("should render logo", () => {
      render(<MobileMenu {...defaultProps} />);
      expect(screen.getByAltText("KCVV ELEWIJT")).toBeInTheDocument();
    });

    it("should render all menu items", () => {
      render(<MobileMenu {...defaultProps} />);
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Nieuws")).toBeInTheDocument();
      expect(screen.getByText("A-Ploeg")).toBeInTheDocument();
      expect(screen.getByText("B-Ploeg")).toBeInTheDocument();
      expect(screen.getByText("Jeugd")).toBeInTheDocument();
    });
  });

  describe("Active state detection", () => {
    it("should mark Home as active on root path", () => {
      // mockPathname is already "/" from beforeEach
      const { container } = render(<MobileMenu {...defaultProps} />);
      // Select the Home link in the menu (has mobile-nav-link class), not the logo
      const homeLink = container.querySelector('a.mobile-nav-link[href="/"]');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveClass("active");
    });

    it("should mark Nieuws as active on /news path", () => {
      mockPathname = "/news";
      const { container } = render(<MobileMenu {...defaultProps} />);
      const newsLink = container.querySelector(
        'a.mobile-nav-link[href="/news"]',
      );
      expect(newsLink).toHaveClass("active");
    });
  });

  describe("Query parameter active state", () => {
    it("should mark submenu item as active when pathname and tab param match", async () => {
      const user = userEvent.setup();
      mockPathname = "/team/eerste-elftallen-a";
      mockSearchParams = new URLSearchParams("tab=lineup");
      const { container } = render(<MobileMenu {...defaultProps} />);

      // Open the A-Ploeg submenu
      const aPloegButton = screen.getByRole("button", { name: /a-ploeg/i });
      await user.click(aPloegButton);

      // The "Spelers & Staff" link should be active (has ?tab=lineup)
      const spelersLink = container.querySelector(
        'a[href="/team/eerste-elftallen-a?tab=lineup"]',
      );
      expect(spelersLink).toHaveClass("active");
      expect(spelersLink).toHaveClass("text-kcvv-green-bright");
    });

    it("should mark Info as active when on team page without tab param", async () => {
      const user = userEvent.setup();
      mockPathname = "/team/eerste-elftallen-a";
      mockSearchParams = new URLSearchParams();
      const { container } = render(<MobileMenu {...defaultProps} />);

      // Open the A-Ploeg submenu
      const aPloegButton = screen.getByRole("button", { name: /a-ploeg/i });
      await user.click(aPloegButton);

      // The "Info" link should be active (no tab param)
      const infoLink = container.querySelector(
        'a[href="/team/eerste-elftallen-a"]',
      );
      expect(infoLink).toHaveClass("active");
      expect(infoLink).toHaveClass("text-kcvv-green-bright");
    });

    it("should not mark Info as active when tab param exists", async () => {
      const user = userEvent.setup();
      mockPathname = "/team/eerste-elftallen-a";
      mockSearchParams = new URLSearchParams("tab=matches");
      const { container } = render(<MobileMenu {...defaultProps} />);

      // Open the A-Ploeg submenu
      const aPloegButton = screen.getByRole("button", { name: /a-ploeg/i });
      await user.click(aPloegButton);

      // The "Info" link should NOT be active when we're on ?tab=matches
      const infoLink = container.querySelector(
        'a[href="/team/eerste-elftallen-a"]',
      );
      expect(infoLink).not.toHaveClass("active");
    });

    it("should mark Wedstrijden as active when tab=matches", async () => {
      const user = userEvent.setup();
      mockPathname = "/team/eerste-elftallen-b";
      mockSearchParams = new URLSearchParams("tab=matches");
      const { container } = render(<MobileMenu {...defaultProps} />);

      // Open the B-Ploeg submenu
      const bPloegButton = screen.getByRole("button", { name: /b-ploeg/i });
      await user.click(bPloegButton);

      // The "Wedstrijden" link should be active
      const wedstrijdenLink = container.querySelector(
        'a[href="/team/eerste-elftallen-b?tab=matches"]',
      );
      expect(wedstrijdenLink).toHaveClass("active");
    });

    it("should mark Stand as active when tab=standings", async () => {
      const user = userEvent.setup();
      mockPathname = "/team/eerste-elftallen-a";
      mockSearchParams = new URLSearchParams("tab=standings");
      const { container } = render(<MobileMenu {...defaultProps} />);

      // Open the A-Ploeg submenu
      const aPloegButton = screen.getByRole("button", { name: /a-ploeg/i });
      await user.click(aPloegButton);

      // The "Stand" link should be active
      const standLink = container.querySelector(
        'a[href="/team/eerste-elftallen-a?tab=standings"]',
      );
      expect(standLink).toHaveClass("active");
    });
  });

  describe("Submenu toggle", () => {
    it("should toggle submenu when clicked", async () => {
      const user = userEvent.setup();
      render(<MobileMenu {...defaultProps} />);

      const jeugdButton = screen.getByRole("button", { name: /jeugd/i });
      await user.click(jeugdButton);

      // Submenu items should be visible
      expect(screen.getByText("U21")).toBeInTheDocument();
      expect(screen.getByText("U17")).toBeInTheDocument();
    });
  });

  describe("Close behavior", () => {
    it("should call onClose when close button clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<MobileMenu isOpen={true} onClose={onClose} />);

      await user.click(screen.getByLabelText(/close menu/i));
      expect(onClose).toHaveBeenCalled();
    });

    it("should call onClose when backdrop clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const { container } = render(
        <MobileMenu isOpen={true} onClose={onClose} />,
      );

      // Click the backdrop (first fixed div with bg-black/50)
      const backdrop = container.querySelector(".bg-black\\/50");
      expect(backdrop).not.toBeNull();
      await user.click(backdrop!);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("Custom className", () => {
    it("should apply custom className to nav", () => {
      render(<MobileMenu {...defaultProps} className="custom-class" />);
      const nav = screen.getByRole("navigation", {
        name: /mobile navigation/i,
      });
      expect(nav).toHaveClass("custom-class");
    });
  });
});

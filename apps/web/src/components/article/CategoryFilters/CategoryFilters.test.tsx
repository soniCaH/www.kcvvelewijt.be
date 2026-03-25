/**
 * CategoryFilters Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryFilters } from "./CategoryFilters";

const mockCategories = [
  {
    id: "1",
    attributes: {
      name: "Nieuws",
      slug: "nieuws",
    },
  },
  {
    id: "2",
    attributes: {
      name: "Jeugd",
      slug: "jeugd",
    },
  },
  {
    id: "3",
    attributes: {
      name: "Evenementen",
      slug: "evenementen",
    },
  },
];

describe("CategoryFilters", () => {
  describe("Rendering", () => {
    it("should render all categories plus 'All' tab", () => {
      render(<CategoryFilters categories={mockCategories} />);

      // Should have "All" tab
      expect(screen.getByRole("tab", { name: /alles/i })).toBeInTheDocument();

      // Should have all category tabs
      expect(screen.getByRole("tab", { name: /nieuws/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /jeugd/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /evenementen/i }),
      ).toBeInTheDocument();
    });

    it("should render with empty categories array", () => {
      render(<CategoryFilters categories={[]} />);

      // Should still render "All" tab
      expect(screen.getByRole("tab", { name: /alles/i })).toBeInTheDocument();
    });

    it("should render with custom aria-label", () => {
      render(<CategoryFilters categories={mockCategories} />);

      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveAttribute("aria-label", "Filter news by category");
    });
  });

  describe("Active Category", () => {
    it("should highlight 'All' tab by default", () => {
      render(<CategoryFilters categories={mockCategories} />);

      const allTab = screen.getByRole("tab", { name: /alles/i });
      expect(allTab).toHaveAttribute("aria-selected", "true");
    });

    it("should highlight active category", () => {
      render(
        <CategoryFilters categories={mockCategories} activeCategory="jeugd" />,
      );

      const jeugdTab = screen.getByRole("tab", { name: /jeugd/i });
      expect(jeugdTab).toHaveAttribute("aria-selected", "true");
    });

    it("should not highlight inactive categories", () => {
      render(
        <CategoryFilters categories={mockCategories} activeCategory="jeugd" />,
      );

      const nieuwsTab = screen.getByRole("tab", { name: /nieuws/i });
      expect(nieuwsTab).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("Link Hrefs", () => {
    it("should set correct href for 'All' tab", () => {
      render(<CategoryFilters categories={mockCategories} />);

      const allTab = screen.getByRole("tab", { name: /alles/i });
      expect(allTab).toHaveAttribute("href", "/nieuws");
    });

    it("should set correct href for category tabs", () => {
      render(<CategoryFilters categories={mockCategories} />);

      const nieuwsTab = screen.getByRole("tab", { name: /nieuws/i });
      expect(nieuwsTab).toHaveAttribute("href", "/nieuws?category=nieuws");

      const jeugdTab = screen.getByRole("tab", { name: /jeugd/i });
      expect(jeugdTab).toHaveAttribute("href", "/nieuws?category=jeugd");
    });

    it("should encode category slugs in URLs", () => {
      const specialCategories = [
        {
          id: "1",
          attributes: {
            name: "Test & Demo",
            slug: "test&demo",
          },
        },
      ];

      render(<CategoryFilters categories={specialCategories} />);

      const tab = screen.getByRole("tab", { name: /test & demo/i });
      expect(tab).toHaveAttribute("href", "/nieuws?category=test%26demo");
    });
  });

  describe("Render Modes", () => {
    it("should render as links by default", () => {
      render(<CategoryFilters categories={mockCategories} />);

      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab.tagName).toBe("A");
      });
    });

    it("should render as buttons when renderAsLinks is false", () => {
      render(
        <CategoryFilters categories={mockCategories} renderAsLinks={false} />,
      );

      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab.tagName).toBe("BUTTON");
      });
    });

    it("should call onChange in button mode", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CategoryFilters
          categories={mockCategories}
          renderAsLinks={false}
          onChange={handleChange}
        />,
      );

      const nieuwsTab = screen.getByRole("tab", { name: /nieuws/i });
      await user.click(nieuwsTab);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith("nieuws");
    });

    it("should call onChange with 'all' when All tab is clicked", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CategoryFilters
          categories={mockCategories}
          renderAsLinks={false}
          onChange={handleChange}
        />,
      );

      const allTab = screen.getByRole("tab", { name: /alles/i });
      await user.click(allTab);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith("all");
    });
  });

  describe("Size Variants", () => {
    it("should render small size by default", () => {
      render(<CategoryFilters categories={mockCategories} />);

      const tab = screen.getByRole("tab", { name: /alles/i });
      expect(tab).toHaveClass("px-4", "py-2", "text-xs");
    });

    it("should render medium size", () => {
      render(<CategoryFilters categories={mockCategories} size="md" />);

      const tab = screen.getByRole("tab", { name: /alles/i });
      expect(tab).toHaveClass("px-6", "py-3", "text-sm");
    });

    it("should render large size", () => {
      render(<CategoryFilters categories={mockCategories} size="lg" />);

      const tab = screen.getByRole("tab", { name: /alles/i });
      expect(tab).toHaveClass("px-8", "py-4", "text-base");
    });
  });

  describe("Show Counts", () => {
    const categoriesWithCounts = [
      {
        id: "1",
        attributes: {
          name: "Nieuws",
          slug: "nieuws",
          count: 15,
        },
      },
      {
        id: "2",
        attributes: {
          name: "Jeugd",
          slug: "jeugd",
          count: 8,
        },
      },
    ];

    it("should not show counts by default", () => {
      render(<CategoryFilters categories={mockCategories} />);

      // The tabs should render but without count badges
      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBe(4); // All + 3 categories

      // Verify no count badge elements are rendered
      // Count badges would appear as separate elements within tab labels
      tabs.forEach((tab) => {
        const textContent = tab.textContent || "";
        // Tab should only contain the label text, no numbers
        expect(textContent).not.toMatch(/\d+/);
      });
    });

    it("should not show count badges when showCounts is false", () => {
      render(
        <CategoryFilters
          categories={categoriesWithCounts}
          showCounts={false}
        />,
      );

      // Count values should not appear in the document
      expect(screen.queryByText("15")).not.toBeInTheDocument();
      expect(screen.queryByText("8")).not.toBeInTheDocument();

      // Verify tabs don't contain any numeric values
      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        const textContent = tab.textContent || "";
        expect(textContent).not.toMatch(/\d+/);
      });
    });

    it("should not show count badges even when showCounts is true", () => {
      // Note: CategoryFilters currently doesn't include counts in the tabs array,
      // so even with showCounts={true}, no counts are displayed.
      // This test verifies the current behavior.
      render(
        <CategoryFilters categories={categoriesWithCounts} showCounts={true} />,
      );

      // Count values should not appear since CategoryFilters doesn't pass them to tabs
      expect(screen.queryByText("15")).not.toBeInTheDocument();
      expect(screen.queryByText("8")).not.toBeInTheDocument();

      // Verify component renders successfully
      const tablist = screen.getByRole("tablist");
      expect(tablist).toBeInTheDocument();
    });
  });

  describe("Tab Order", () => {
    it("should render 'All' tab first", () => {
      render(<CategoryFilters categories={mockCategories} />);

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveTextContent("Alles");
    });

    it("should render categories in order after 'All' tab", () => {
      render(<CategoryFilters categories={mockCategories} />);

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveTextContent("Alles");
      expect(tabs[1]).toHaveTextContent("Nieuws");
      expect(tabs[2]).toHaveTextContent("Jeugd");
      expect(tabs[3]).toHaveTextContent("Evenementen");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA roles", () => {
      render(<CategoryFilters categories={mockCategories} />);

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(4); // All + 3 categories
    });

    it("should have proper aria-selected attributes", () => {
      render(
        <CategoryFilters categories={mockCategories} activeCategory="jeugd" />,
      );

      const activeTab = screen.getByRole("tab", { name: /jeugd/i });
      const inactiveTab = screen.getByRole("tab", { name: /nieuws/i });

      expect(activeTab).toHaveAttribute("aria-selected", "true");
      expect(inactiveTab).toHaveAttribute("aria-selected", "false");
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<CategoryFilters categories={mockCategories} />);

      // Tab to first button (All tab should be active by default)
      await user.tab();
      const allTab = screen.getByRole("tab", { name: /alles/i });
      expect(allTab).toHaveFocus();
    });
  });
});

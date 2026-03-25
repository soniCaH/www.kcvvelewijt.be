import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArticleMetadata } from "./ArticleMetadata";

describe("ArticleMetadata", () => {
  const defaultProps = {
    author: "Jan Janssens",
    date: "15/01/2025",
    category: { name: "Eerste ploeg", href: "/nieuws?category=eerste-ploeg" },
    shareConfig: {
      url: "https://kcvvelewijt.be/nieuws/test",
      title: "Test Article",
    },
  };

  it("renders breadcrumb with News link and category", () => {
    render(<ArticleMetadata {...defaultProps} />);
    // "News" breadcrumb link
    const newsLink = screen.getByRole("link", { name: "Nieuws" });
    expect(newsLink).toHaveAttribute("href", "/nieuws");
    // Category breadcrumb link
    const categoryLink = screen.getByRole("link", { name: "Eerste ploeg" });
    expect(categoryLink).toHaveAttribute(
      "href",
      "/nieuws?category=eerste-ploeg",
    );
  });

  it("renders breadcrumb separator between News and category", () => {
    render(<ArticleMetadata {...defaultProps} />);
    expect(screen.getByText("›")).toBeInTheDocument();
  });

  it("renders the author name", () => {
    render(<ArticleMetadata {...defaultProps} />);
    expect(screen.getByText(/Jan Janssens/)).toBeInTheDocument();
  });

  it("renders the date", () => {
    render(<ArticleMetadata {...defaultProps} />);
    expect(screen.getByText("15/01/2025")).toBeInTheDocument();
  });

  it("renders as a nav element for breadcrumb semantics", () => {
    const { container } = render(<ArticleMetadata {...defaultProps} />);
    expect(container.querySelector("nav")).toBeInTheDocument();
  });

  it("renders share buttons as icon-only (no text labels)", () => {
    render(<ArticleMetadata {...defaultProps} />);
    // Should NOT have "Facebook" or "Twitter" text labels
    expect(screen.queryByText("Facebook")).not.toBeInTheDocument();
    expect(screen.queryByText("Twitter")).not.toBeInTheDocument();
  });

  it("renders share label visible on tablet+ (sr-only on mobile)", () => {
    render(<ArticleMetadata {...defaultProps} />);
    const shareLabel = screen.getByText("Delen:");
    expect(shareLabel).toBeInTheDocument();
    // Hidden on mobile, visible on md+
    expect(shareLabel).toHaveClass("sr-only");
    expect(shareLabel).toHaveClass("md:not-sr-only");
  });

  it("does not render share section without shareConfig", () => {
    render(
      <ArticleMetadata
        author="Test"
        date="01/01/2025"
        category={defaultProps.category}
      />,
    );
    expect(screen.queryByText("Delen:")).not.toBeInTheDocument();
  });

  it("renders breadcrumb-only when no category provided", () => {
    render(<ArticleMetadata author="Test" date="01/01/2025" />);
    const newsLink = screen.getByRole("link", { name: "Nieuws" });
    expect(newsLink).toBeInTheDocument();
    // No category link, no separator
    expect(screen.queryByText("›")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ArticleMetadata {...defaultProps} className="custom-metadata" />,
    );
    expect(container.querySelector("nav")).toHaveClass("custom-metadata");
  });

  it("does not use sidebar layout classes", () => {
    const { container } = render(<ArticleMetadata {...defaultProps} />);
    const nav = container.querySelector("nav");
    expect(nav).not.toHaveClass("lg:max-w-[20rem]");
    expect(nav).not.toHaveClass("lg:border-l");
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArticleHeader } from "./ArticleHeader";

describe("ArticleHeader", () => {
  const defaultProps = {
    title: "Test Article Title",
    imageUrl: "/images/test-article.jpg",
    imageAlt: "Test article image",
  };

  it("renders the article title as h1", () => {
    render(<ArticleHeader {...defaultProps} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Test Article Title",
    );
  });

  it("renders a header element", () => {
    const { container } = render(<ArticleHeader {...defaultProps} />);
    expect(container.querySelector("header")).toBeInTheDocument();
  });

  it("renders hero image with correct alt text", () => {
    render(<ArticleHeader {...defaultProps} />);
    expect(screen.getByAltText("Test article image")).toBeInTheDocument();
  });

  it("renders full-bleed hero with gradient overlay", () => {
    const { container } = render(<ArticleHeader {...defaultProps} />);
    // Should have a gradient overlay div
    const gradientOverlay = container.querySelector("[aria-hidden='true']");
    expect(gradientOverlay).toBeInTheDocument();
    expect(gradientOverlay).toHaveClass("bg-gradient-to-t");
  });

  it("renders title overlaid on the hero image (not in separate green section)", () => {
    const { container } = render(<ArticleHeader {...defaultProps} />);
    // Title should be inside the hero container, not in a separate green div
    const header = container.querySelector("header");
    // Should NOT have the old green background pattern
    expect(header?.innerHTML).not.toContain("#4acf52");
    expect(header?.innerHTML).not.toContain("header-pattern");
  });

  it("uses 3:2 aspect ratio", () => {
    const { container } = render(<ArticleHeader {...defaultProps} />);
    const aspectContainer = container.querySelector(".aspect-\\[3\\/2\\]");
    expect(aspectContainer).toBeInTheDocument();
  });

  it("renders fallback with dark background when no image provided", () => {
    const { container } = render(<ArticleHeader title="No Image Article" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "No Image Article",
    );
    // Should have dark background fallback
    const fallback = container.querySelector(".bg-kcvv-black");
    expect(fallback).toBeInTheDocument();
    // Should NOT have green background
    expect(container.innerHTML).not.toContain("#4acf52");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ArticleHeader {...defaultProps} className="custom-header" />,
    );
    expect(container.querySelector("header")).toHaveClass("custom-header");
  });

  it("handles long titles", () => {
    render(
      <ArticleHeader
        {...defaultProps}
        title="This is a very long article title that should still render correctly without breaking the layout"
      />,
    );
    expect(
      screen.getByText(
        "This is a very long article title that should still render correctly without breaking the layout",
      ),
    ).toBeInTheDocument();
  });

  it("handles missing image alt text with fallback", () => {
    render(<ArticleHeader title="Test" imageUrl="/test.jpg" />);
    expect(screen.getByRole("heading")).toHaveTextContent("Test");
  });
});

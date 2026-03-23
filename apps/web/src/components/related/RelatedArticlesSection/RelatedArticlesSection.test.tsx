import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelatedArticlesSection } from "./RelatedArticlesSection";

describe("RelatedArticlesSection", () => {
  const mockArticles = [
    {
      _id: "article-1",
      title: "Interview met Jan",
      slug: { current: "interview-jan" },
      publishAt: "2026-03-20T10:00:00Z",
      coverImageUrl: "https://cdn.sanity.io/img1.jpg",
    },
    {
      _id: "article-2",
      title: "Wedstrijdverslag",
      slug: { current: "wedstrijdverslag" },
      publishAt: "2026-03-19T10:00:00Z",
      coverImageUrl: null,
    },
  ];

  it("renders section heading and article links", () => {
    render(<RelatedArticlesSection articles={mockArticles} />);

    expect(screen.getByText("Gerelateerd")).toBeInTheDocument();
    expect(screen.getByText("Interview met Jan")).toBeInTheDocument();
    expect(screen.getByText("Wedstrijdverslag")).toBeInTheDocument();
  });

  it("renders article links pointing to /news/[slug]", () => {
    render(<RelatedArticlesSection articles={mockArticles} />);

    const link = screen.getByText("Interview met Jan").closest("a");
    expect(link).toHaveAttribute("href", "/news/interview-jan");
  });

  it("returns null when articles array is empty", () => {
    const { container } = render(<RelatedArticlesSection articles={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders article cover images when available", () => {
    render(<RelatedArticlesSection articles={mockArticles} />);

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(1); // Only article-1 has a coverImageUrl
    expect(images[0]).toHaveAttribute("alt", "Interview met Jan");
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArticleFooter } from "./ArticleFooter";
import type { RelatedContent } from "./ArticleFooter";

describe("ArticleFooter", () => {
  const sampleRelatedContent: RelatedContent[] = [
    {
      title: "Related Article 1",
      href: "/nieuws/article-1",
      type: "article",
    },
    {
      title: "Related Player Profile",
      href: "/player/john-doe",
      type: "player",
    },
    {
      title: "Related Team Page",
      href: "/team/a-ploeg",
      type: "team",
    },
  ];

  it("renders the heading", () => {
    render(<ArticleFooter relatedContent={sampleRelatedContent} />);
    expect(
      screen.getByRole("heading", { name: /Gerelateerde inhoud/i }),
    ).toBeInTheDocument();
  });

  it("renders all related content items", () => {
    render(<ArticleFooter relatedContent={sampleRelatedContent} />);
    expect(screen.getByText("Related Article 1")).toBeInTheDocument();
    expect(screen.getByText("Related Player Profile")).toBeInTheDocument();
    expect(screen.getByText("Related Team Page")).toBeInTheDocument();
  });

  it("renders links with correct hrefs", () => {
    render(<ArticleFooter relatedContent={sampleRelatedContent} />);
    const link1 = screen.getByRole("link", { name: "Related Article 1" });
    expect(link1).toHaveAttribute("href", "/nieuws/article-1");

    const link2 = screen.getByRole("link", { name: "Related Player Profile" });
    expect(link2).toHaveAttribute("href", "/player/john-doe");
  });

  it("renders icons for different content types", () => {
    const { container } = render(
      <ArticleFooter relatedContent={sampleRelatedContent} />,
    );
    // Should have 3 icon containers
    const iconContainers = container.querySelectorAll(".bg-kcvv-green-dark");
    expect(iconContainers.length).toBe(3);
  });

  it("does not render when relatedContent is empty", () => {
    const { container } = render(<ArticleFooter relatedContent={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("does not render when relatedContent is undefined", () => {
    const { container } = render(
      <ArticleFooter
        relatedContent={undefined as unknown as RelatedContent[]}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders single item spanning full width", () => {
    const singleItem: RelatedContent[] = [
      {
        title: "Single Related Item",
        href: "/nieuws/single",
        type: "article",
      },
    ];
    const { container } = render(<ArticleFooter relatedContent={singleItem} />);
    expect(screen.getByText("Single Related Item")).toBeInTheDocument();
    // Single item should span full width
    const article = container.querySelector("article");
    expect(article).toHaveClass("lg:col-span-3");
  });

  it("renders multiple items in grid", () => {
    const { container } = render(
      <ArticleFooter relatedContent={sampleRelatedContent} />,
    );
    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("lg:grid-cols-3");
  });

  it("has correct background color", () => {
    const { container } = render(
      <ArticleFooter relatedContent={sampleRelatedContent} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("bg-kcvv-green-bright");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ArticleFooter
        relatedContent={sampleRelatedContent}
        className="custom-footer"
      />,
    );
    expect(container.firstChild).toHaveClass("custom-footer");
  });

  it("renders all content types correctly", () => {
    const allTypes: RelatedContent[] = [
      { title: "Article", href: "/nieuws/test", type: "article" },
      { title: "Player", href: "/player/test", type: "player" },
      { title: "Staff", href: "/staff/test", type: "staff" },
      { title: "Team", href: "/team/test", type: "team" },
    ];
    render(<ArticleFooter relatedContent={allTypes} />);
    expect(screen.getByText("Article")).toBeInTheDocument();
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("Staff")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
  });

  it("renders white text links", () => {
    render(<ArticleFooter relatedContent={sampleRelatedContent} />);
    const link = screen.getByRole("link", { name: "Related Article 1" });
    expect(link).toHaveClass("text-white");
  });
});

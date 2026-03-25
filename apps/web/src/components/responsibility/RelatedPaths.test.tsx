import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelatedPaths } from "./RelatedPaths";

vi.mock("../../hooks/useRelatedContent", () => ({
  useRelatedContent: vi.fn(),
}));

import { useRelatedContent } from "../../hooks/useRelatedContent";

describe("RelatedPaths", () => {
  beforeEach(() => {
    vi.mocked(useRelatedContent).mockReturnValue({
      results: [],
      loading: false,
    });
  });

  it("renders nothing when there are no results", () => {
    const { container } = render(<RelatedPaths sanityId="doc-abc" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing while loading", () => {
    vi.mocked(useRelatedContent).mockReturnValue({
      results: [],
      loading: true,
    });
    const { container } = render(<RelatedPaths sanityId="doc-abc" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders related items with 'Zie ook' heading", async () => {
    vi.mocked(useRelatedContent).mockReturnValue({
      results: [
        {
          id: "doc-def",
          slug: "blessure-melden",
          type: "responsibilityPath",
          score: 0.85,
          title: "Blessure melden",
          excerpt: "Hoe meld je een blessure...",
        },
        {
          id: "doc-ghi",
          slug: "nieuws-artikel",
          type: "article",
          score: 0.72,
          title: "Nieuws over blessures",
          excerpt: "Een nieuwsbericht...",
        },
      ],
      loading: false,
    });

    render(<RelatedPaths sanityId="doc-abc" />);

    expect(screen.getByText("Zie ook")).toBeInTheDocument();
    expect(screen.getByText("Blessure melden")).toBeInTheDocument();
    expect(screen.getByText("Nieuws over blessures")).toBeInTheDocument();
  });

  it("links responsibilityPath items to /hulp?path=<slug>", () => {
    vi.mocked(useRelatedContent).mockReturnValue({
      results: [
        {
          id: "doc-def",
          slug: "blessure-melden",
          type: "responsibilityPath",
          score: 0.85,
          title: "Blessure melden",
          excerpt: "Hoe meld je...",
        },
      ],
      loading: false,
    });

    render(<RelatedPaths sanityId="doc-abc" />);

    const link = screen.getByRole("link", { name: /Blessure melden/ });
    expect(link).toHaveAttribute("href", "/hulp?path=blessure-melden");
  });

  it("links page items to /<slug> (default branch)", () => {
    vi.mocked(useRelatedContent).mockReturnValue({
      results: [
        {
          id: "doc-page",
          slug: "over-ons",
          type: "page",
          score: 0.6,
          title: "Over ons",
          excerpt: "Info over de club",
        },
      ],
      loading: false,
    });

    render(<RelatedPaths sanityId="doc-abc" />);

    const link = screen.getByRole("link", { name: /Over ons/ });
    expect(link).toHaveAttribute("href", "/over-ons");
  });

  it("links article items to /nieuws/<slug>", () => {
    vi.mocked(useRelatedContent).mockReturnValue({
      results: [
        {
          id: "doc-ghi",
          slug: "nieuws-artikel",
          type: "article",
          score: 0.72,
          title: "Nieuws artikel",
          excerpt: "Een nieuwsbericht...",
        },
      ],
      loading: false,
    });

    render(<RelatedPaths sanityId="doc-abc" />);

    const link = screen.getByRole("link", { name: /Nieuws artikel/ });
    expect(link).toHaveAttribute("href", "/nieuws/nieuws-artikel");
  });
});

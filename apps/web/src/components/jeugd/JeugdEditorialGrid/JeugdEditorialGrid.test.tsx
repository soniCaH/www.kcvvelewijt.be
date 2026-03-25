import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JeugdEditorialGrid } from "./JeugdEditorialGrid";
import type { ArticleVM } from "@/lib/repositories/article.repository";

function makeArticle(overrides: Partial<ArticleVM> = {}): ArticleVM {
  return {
    id: "art-1",
    title: "Test Article",
    slug: "test-article",
    publishedAt: "2026-03-01",
    featured: false,
    tags: ["jeugd"],
    ...overrides,
  };
}

describe("JeugdEditorialGrid", () => {
  it("renders section header with label and title", () => {
    render(<JeugdEditorialGrid articles={[]} />);

    expect(screen.getByText("Ontdek onze jeugd")).toBeInTheDocument();
    expect(screen.getByText("Alles op één plek")).toBeInTheDocument();
  });

  it("renders all 6 nav cards with correct titles", () => {
    render(<JeugdEditorialGrid articles={[]} />);

    expect(screen.getByText("Word lid van KCVV")).toBeInTheDocument();
    expect(screen.getByText("Onze jeugdvisie")).toBeInTheDocument();
    expect(screen.getByText("Trainingen & ProSoccerData")).toBeInTheDocument();
    expect(screen.getByText("Organigram")).toBeInTheDocument();
    expect(screen.getByText("Wie contacteer ik?")).toBeInTheDocument();
    expect(screen.getByText("Blessure of afmelding?")).toBeInTheDocument();
  });

  it("renders nav card links pointing to correct routes", () => {
    render(<JeugdEditorialGrid articles={[]} />);

    const links = screen.getAllByRole("link");
    const hrefs = links.map((link) => link.getAttribute("href"));

    expect(hrefs).toContain("/club/register");
    expect(hrefs).toContain("/jeugd/visie");
    expect(hrefs).toContain("/nieuws/prosoccerdata");
    expect(hrefs).toContain("/club/organigram");
    expect(hrefs).toContain("/hulp");
    expect(hrefs).toContain("/jeugd/medisch");
  });

  it("renders 3 article cards when 3 articles provided", () => {
    const articles = [
      makeArticle({ id: "a1", title: "Article One", slug: "article-one" }),
      makeArticle({ id: "a2", title: "Article Two", slug: "article-two" }),
      makeArticle({ id: "a3", title: "Article Three", slug: "article-three" }),
    ];

    render(<JeugdEditorialGrid articles={articles} />);

    expect(screen.getByText("Article One")).toBeInTheDocument();
    expect(screen.getByText("Article Two")).toBeInTheDocument();
    expect(screen.getByText("Article Three")).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/nieuws/article-one");
    expect(hrefs).toContain("/nieuws/article-two");
    expect(hrefs).toContain("/nieuws/article-three");
  });

  it("renders 9 total cards when 3 articles provided", () => {
    const articles = [
      makeArticle({ id: "a1", title: "A1", slug: "a1" }),
      makeArticle({ id: "a2", title: "A2", slug: "a2" }),
      makeArticle({ id: "a3", title: "A3", slug: "a3" }),
    ];

    render(<JeugdEditorialGrid articles={articles} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(9);
  });

  it("renders only 6 nav cards when no articles provided", () => {
    render(<JeugdEditorialGrid articles={[]} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
  });

  it("renders only 7 cards when 1 article provided (1 article + 6 nav)", () => {
    const articles = [
      makeArticle({ id: "a1", title: "Only One", slug: "only-one" }),
    ];

    render(<JeugdEditorialGrid articles={articles} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(7);
    expect(screen.getByText("Only One")).toBeInTheDocument();
  });

  it("marks the first article as featured", () => {
    const articles = [
      makeArticle({ id: "a1", title: "Featured Article", slug: "featured" }),
    ];

    render(<JeugdEditorialGrid articles={articles} />);

    // Featured card has Lees meer arrow text
    expect(screen.getByText("Featured Article")).toBeInTheDocument();
    // Featured card should have p-10 padding (featured prop)
    const link = screen.getByRole("link", { name: /featured article/i });
    const content = link.querySelector("[data-testid='card-content']");
    expect(content?.className).toContain("p-10");
  });

  it("renders 12-column grid container", () => {
    render(<JeugdEditorialGrid articles={[]} />);

    const grid = screen.getByTestId("jeugd-editorial-grid");
    expect(grid.className).toContain("grid-cols-12");
  });
});

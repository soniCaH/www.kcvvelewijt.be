import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JeugdEditorialGrid } from "./JeugdEditorialGrid";
import type { ArticleVM } from "@/lib/repositories/article.repository";
import type { EditorialCardConfig } from "@/lib/repositories/jeugd-landing-page.repository";

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

    expect(hrefs).toContain("/club/inschrijven");
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

  describe("with Sanity editorialConfig", () => {
    function makeNavConfig(
      overrides: Partial<EditorialCardConfig> = {},
    ): EditorialCardConfig {
      return {
        tag: "Aansluiten",
        title: "Word lid van KCVV",
        description: "Nieuwe spelers zijn altijd welkom.",
        arrowText: "Schrijf je in",
        href: "/club/inschrijven",
        imageUrl: null,
        position: "medium",
        cardType: "nav",
        ...overrides,
      };
    }

    it("renders nav card titles from Sanity config instead of hardcoded", () => {
      const config: EditorialCardConfig[] = [
        makeNavConfig({ title: "Sanity Nav Card 1", position: "medium" }),
        makeNavConfig({ title: "Sanity Nav Card 2", position: "third" }),
      ];

      render(<JeugdEditorialGrid articles={[]} editorialConfig={config} />);

      expect(screen.getByText("Sanity Nav Card 1")).toBeInTheDocument();
      expect(screen.getByText("Sanity Nav Card 2")).toBeInTheDocument();
      // Hardcoded defaults should NOT appear
      expect(screen.queryByText("Onze jeugdvisie")).not.toBeInTheDocument();
      expect(screen.queryByText("Organigram")).not.toBeInTheDocument();
    });

    it("renders nav card links from Sanity config", () => {
      const config: EditorialCardConfig[] = [
        makeNavConfig({ href: "/sanity/route-1", position: "medium" }),
        makeNavConfig({ href: "/sanity/route-2", position: "third" }),
      ];

      render(<JeugdEditorialGrid articles={[]} editorialConfig={config} />);

      const hrefs = screen
        .getAllByRole("link")
        .map((l) => l.getAttribute("href"));
      expect(hrefs).toContain("/sanity/route-1");
      expect(hrefs).toContain("/sanity/route-2");
      // Hardcoded default routes should NOT appear
      expect(hrefs).not.toContain("/jeugd/visie");
    });

    it("auto-fills article slots from articles prop when config has article cardType", () => {
      const config: EditorialCardConfig[] = [
        makeNavConfig({ cardType: "article", position: "featured" }),
        makeNavConfig({ title: "Nav from Sanity", position: "medium" }),
      ];
      const articles = [
        makeArticle({ id: "a1", title: "Sanity Article", slug: "sanity-art" }),
      ];

      render(
        <JeugdEditorialGrid articles={articles} editorialConfig={config} />,
      );

      expect(screen.getByText("Sanity Article")).toBeInTheDocument();
      expect(screen.getByText("Nav from Sanity")).toBeInTheDocument();
    });

    it("falls back to hardcoded defaults when editorialConfig is null", () => {
      render(<JeugdEditorialGrid articles={[]} editorialConfig={null} />);

      // Hardcoded cards should appear
      expect(screen.getByText("Word lid van KCVV")).toBeInTheDocument();
      expect(screen.getByText("Onze jeugdvisie")).toBeInTheDocument();
    });

    it("falls back to hardcoded defaults when editorialConfig is undefined", () => {
      render(<JeugdEditorialGrid articles={[]} />);

      expect(screen.getByText("Word lid van KCVV")).toBeInTheDocument();
    });
  });
});

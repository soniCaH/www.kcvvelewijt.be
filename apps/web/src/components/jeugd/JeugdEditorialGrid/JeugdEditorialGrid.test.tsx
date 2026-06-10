import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { JeugdEditorialGrid } from "./JeugdEditorialGrid";
import type { ArticleVM } from "@/lib/repositories/article.repository";
import type { EditorialCardConfig } from "@/lib/repositories/jeugd-landing-page.repository";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...rest }: ImageProps) => {
    const props = { alt, src: typeof src === "string" ? src : "", ...rest };
    return <img {...props} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function makeArticle(overrides: Partial<ArticleVM> = {}): ArticleVM {
  return {
    id: "art-1",
    title: "Test Article",
    slug: "test-article",
    publishedAt: "2026-03-01",
    featured: false,
    coverImageUrl: null,
    tags: ["jeugd"],
    articleType: null,
    subjects: null,
    firstTransferFact: null,
    firstEventFact: null,
    ...overrides,
  };
}

describe("JeugdEditorialGrid", () => {
  it("renders the section kicker", () => {
    render(<JeugdEditorialGrid articles={[]} />);
    expect(screen.getByText("Ontdek onze jeugd")).toBeInTheDocument();
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

  it("repoints nav cards to live routes (no more dead routes)", () => {
    render(<JeugdEditorialGrid articles={[]} />);

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    // Repointed (7j0b): word lid + medisch → /hulp, jeugdvisie → #visie anchor.
    expect(hrefs).toContain("/hulp");
    expect(hrefs).toContain("/jeugd#visie");
    expect(hrefs).toContain("/nieuws/prosoccerdata");
    expect(hrefs).toContain("/club/organigram");

    // Old dead routes are gone.
    expect(hrefs).not.toContain("/club/inschrijven");
    expect(hrefs).not.toContain("/jeugd/visie");
    expect(hrefs).not.toContain("/jeugd/medisch");
  });

  it("renders 3 article cards (news variant) when 3 articles provided", () => {
    const articles = [
      makeArticle({ id: "a1", title: "Article One", slug: "article-one" }),
      makeArticle({ id: "a2", title: "Article Two", slug: "article-two" }),
      makeArticle({ id: "a3", title: "Article Three", slug: "article-three" }),
    ];

    render(<JeugdEditorialGrid articles={articles} />);

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
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
    expect(screen.getAllByRole("link")).toHaveLength(9);
  });

  it("collapses to 6 nav cards when no articles provided", () => {
    render(<JeugdEditorialGrid articles={[]} />);
    expect(screen.getAllByRole("link")).toHaveLength(6);
  });

  it("renders 7 cards when 1 article provided (1 article + 6 nav)", () => {
    const articles = [
      makeArticle({ id: "a1", title: "Only One", slug: "only-one" }),
    ];

    render(<JeugdEditorialGrid articles={articles} />);
    expect(screen.getAllByRole("link")).toHaveLength(7);
    expect(screen.getByText("Only One")).toBeInTheDocument();
  });

  it("renders a news cover photo + the article's first tag", () => {
    const articles = [
      makeArticle({
        id: "a1",
        title: "Met cover",
        slug: "met-cover",
        coverImageUrl: "https://cdn.example.com/cover.jpg",
        tags: ["Bovenbouw", "Jeugd"],
      }),
    ];

    const { container } = render(<JeugdEditorialGrid articles={articles} />);

    // The cover is decorative (alt="") — the title is the link's accessible
    // name — so it carries no `img` role; query it by src instead.
    const cover = container.querySelector(
      'img[src="https://cdn.example.com/cover.jpg"]',
    );
    expect(cover).toBeInTheDocument();
    // News tag = article.tags[0].
    expect(screen.getByText("Bovenbouw")).toBeInTheDocument();
  });

  it("renders a uniform responsive grid (not the legacy 12-col layout)", () => {
    render(<JeugdEditorialGrid articles={[]} />);

    const grid = screen.getByTestId("jeugd-editorial-grid");
    expect(grid.className).toContain("lg:grid-cols-3");
    expect(grid.className).not.toContain("grid-cols-12");
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
        href: "/hulp",
        imageUrl: null,
        position: "medium",
        cardType: "nav",
        ...overrides,
      };
    }

    it("renders nav card titles from Sanity config instead of hardcoded", () => {
      const config: EditorialCardConfig[] = [
        makeNavConfig({ title: "Sanity Nav Card 1" }),
        makeNavConfig({ title: "Sanity Nav Card 2" }),
      ];

      render(<JeugdEditorialGrid articles={[]} editorialConfig={config} />);

      expect(screen.getByText("Sanity Nav Card 1")).toBeInTheDocument();
      expect(screen.getByText("Sanity Nav Card 2")).toBeInTheDocument();
      expect(screen.queryByText("Onze jeugdvisie")).not.toBeInTheDocument();
    });

    it("renders nav card links from Sanity config", () => {
      const config: EditorialCardConfig[] = [
        makeNavConfig({ href: "/sanity/route-1" }),
        makeNavConfig({ href: "/sanity/route-2" }),
      ];

      render(<JeugdEditorialGrid articles={[]} editorialConfig={config} />);

      const hrefs = screen
        .getAllByRole("link")
        .map((l) => l.getAttribute("href"));
      expect(hrefs).toContain("/sanity/route-1");
      expect(hrefs).toContain("/sanity/route-2");
    });

    it("renders an empty pill for a Sanity nav card with no tag", () => {
      const config: EditorialCardConfig[] = [
        makeNavConfig({ title: "Geen tag", tag: null, href: "/ergens" }),
      ];

      render(<JeugdEditorialGrid articles={[]} editorialConfig={config} />);

      // The card renders, but no pill text is emitted for the empty tag.
      expect(
        screen.getByRole("link", { name: /geen tag/i }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Aansluiten")).not.toBeInTheDocument();
    });

    it("auto-fills article slots from articles prop when config has article cardType", () => {
      const config: EditorialCardConfig[] = [
        makeNavConfig({ cardType: "article", position: "featured" }),
        makeNavConfig({ title: "Nav from Sanity" }),
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

      expect(screen.getByText("Word lid van KCVV")).toBeInTheDocument();
      expect(screen.getByText("Onze jeugdvisie")).toBeInTheDocument();
    });

    it("falls back to hardcoded defaults when editorialConfig is undefined", () => {
      render(<JeugdEditorialGrid articles={[]} />);
      expect(screen.getByText("Word lid van KCVV")).toBeInTheDocument();
    });
  });
});

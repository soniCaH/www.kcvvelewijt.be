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
    expect(screen.getByText("Ons leerplan")).toBeInTheDocument();
    expect(screen.getByText("Trainingen & ProSoccerData")).toBeInTheDocument();
    expect(screen.getByText("Organigram")).toBeInTheDocument();
    expect(screen.getByText("Wie contacteer ik?")).toBeInTheDocument();
    expect(screen.getByText("Blessure of medisch attest?")).toBeInTheDocument();
  });

  it("repoints nav cards to live routes (no more dead routes)", () => {
    render(<JeugdEditorialGrid articles={[]} />);

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    // Repointed: word lid → /club/word-lid (#2206); structuur → /hulp#structuur.
    expect(hrefs).toContain("/club/word-lid");
    expect(hrefs).toContain("/hulp#structuur");

    // #2960: each nav card lands on a specific answer, not the bare hub.
    // `<HulpFinder>` makes every card `#<slug>` deep-linkable (a direct hit
    // scrolls to the card and expands it) and `?categorie=` filters the set.
    expect(hrefs).toContain("/hulp#prosoccerdata-gebruiken");
    expect(hrefs).toContain("/hulp?categorie=medisch#hulp");

    // #2960: the jeugdvisie tile is now the leerplan download. `/jeugd#visie`
    // scrolled to a single sentence on this same page; the leerplan is the
    // long form of the same promise.
    expect(hrefs).toContain("/downloads/leerplan-jeugdopleiding-2019.pdf");
    expect(hrefs).not.toContain("/jeugd#visie");

    // Exactly one card may still point at the bare hub — "Wie contacteer ik?",
    // whose whole job IS the search box. Any second one is the duplicate this
    // block was flagged for (#2965).
    expect(hrefs.filter((h) => h === "/hulp")).toHaveLength(1);

    // Old dead routes are gone.
    // `/nieuws/prosoccerdata` was asserted here until #2963 — an article that
    // does not exist, so this very test ("no more dead routes") was pinning a
    // dead route. It rendered the not-found page under a 200, which is why it
    // read as live.
    expect(hrefs).not.toContain("/nieuws/prosoccerdata");
    expect(hrefs).not.toContain("/club/inschrijven");
    expect(hrefs).not.toContain("/jeugd/visie");
    expect(hrefs).not.toContain("/jeugd/medisch");
  });

  it("renders the leerplan tile as a document link, not a route (#2960)", () => {
    render(<JeugdEditorialGrid articles={[]} />);

    const pdf = screen
      .getAllByRole("link")
      .find((l) =>
        l.getAttribute("href")?.endsWith("leerplan-jeugdopleiding-2019.pdf"),
      );
    expect(pdf, "leerplan tile missing").toBeDefined();

    // `next/link` has no file-extension guard: it would prefetch 642 KB on
    // viewport entry for every visitor, and open the PDF in the same tab over
    // the site. A plain anchor opts out of both.
    expect(pdf!).toHaveAttribute("target", "_blank");
    expect(pdf!).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("keeps the #hulp hash on the deep-linked hub tiles (#2960)", () => {
    render(<JeugdEditorialGrid articles={[]} />);

    const hrefs = screen
      .getAllByRole("link")
      .map((l) => l.getAttribute("href"));

    // `<HulpFinder>` only scrolls on a `#<slug>` reveal or "see all". A bare
    // `?categorie=` lands on the hero instead of the filtered answers, which
    // is the bare-hub impression these tiles exist to avoid.
    for (const href of hrefs.filter((h) => h?.startsWith("/hulp?"))) {
      expect(href, `${href} needs a hash to scroll`).toContain("#");
    }
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

  it("wires a photo to exactly the three approved nav tiles (#2965)", () => {
    const { container } = render(<JeugdEditorialGrid articles={[]} />);

    // "Word lid van KCVV", "Ons leerplan" and "Trainingen & ProSoccerData"
    // each ship a club photo (#3072); the other three nav tiles
    // ("Organigram", "Wie contacteer ik?", "Blessure of medisch attest?")
    // render no filler photo and keep today's flat bg-jersey-deep + glyph.
    const covers = Array.from(container.querySelectorAll("img")).map((img) =>
      img.getAttribute("src"),
    );
    expect(covers).toContain("/images/jeugd/word-lid-ploeg-in-kring.jpg");
    expect(covers).toContain("/images/jeugd/leerplan-sprint-met-trainer.jpg");
    expect(covers).toContain("/images/jeugd/trainingen-opwarming.jpg");
    expect(covers).toHaveLength(3);
  });

  it("renders the shared 3-up grid at the dense hub gutter (#2569)", () => {
    const { container } = render(<JeugdEditorialGrid articles={[]} />);

    // `data-columns`/`data-gap` are `<TapedCardGrid>`'s published hooks; the
    // breakpoint strings behind them are the primitive's own business.
    const grid = container.querySelector("[data-columns]")!;
    expect(grid.getAttribute("data-columns")).toBe("3");
    expect(grid.getAttribute("data-gap")).toBe("sm");
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
      expect(screen.queryByText("Ons leerplan")).not.toBeInTheDocument();
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

    it("forwards a Sanity nav card's image to the photo treatment (#2965)", () => {
      const config: EditorialCardConfig[] = [
        makeNavConfig({
          title: "Sanity nav met foto",
          href: "/sanity/met-foto",
          imageUrl: "https://cdn.example.com/nav-cover.jpg",
        }),
      ];

      const { container } = render(
        <JeugdEditorialGrid articles={[]} editorialConfig={config} />,
      );

      const cover = container.querySelector(
        'img[src="https://cdn.example.com/nav-cover.jpg"]',
      );
      expect(cover).toBeInTheDocument();
      expect(cover).toHaveAttribute("alt", "");
    });

    it("renders no photo for a Sanity nav card with no image (7j3 default)", () => {
      const config: EditorialCardConfig[] = [
        makeNavConfig({ title: "Sanity nav zonder foto", imageUrl: null }),
      ];

      render(<JeugdEditorialGrid articles={[]} editorialConfig={config} />);

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.getByText("Sanity nav zonder foto")).toBeInTheDocument();
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
      expect(screen.getByText("Ons leerplan")).toBeInTheDocument();
    });

    it("falls back to hardcoded defaults when editorialConfig is undefined", () => {
      render(<JeugdEditorialGrid articles={[]} />);
      expect(screen.getByText("Word lid van KCVV")).toBeInTheDocument();
    });

    it("falls back to hardcoded defaults when editorialConfig is empty (§4)", () => {
      render(<JeugdEditorialGrid articles={[]} editorialConfig={[]} />);
      expect(screen.getByText("Word lid van KCVV")).toBeInTheDocument();
    });
  });
});

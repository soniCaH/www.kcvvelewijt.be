import { describe, it, expect } from "vitest";
import {
  mapEditorialArticles,
  mapBffRelatedItems,
  mapMentionedPlayers,
  mapMentionedTeams,
  mapMentionedStaff,
  mapCuratedRelatedContent,
  articleVMsToRelatedRowItems,
} from "./article-related-items";
import type {
  RelatedArticleItem,
  RelatedEventItem,
  RelatedPlayerItem,
  RelatedTeamItem,
  RelatedStaffItem,
} from "@/components/related/types";
import type { ArticleVM } from "@/lib/repositories/article.repository";
import { formatArticleDate } from "@/lib/utils/dates";

describe("mapEditorialArticles", () => {
  it("maps RelatedArticleRef[] to RelatedArticleItem[]", () => {
    const result = mapEditorialArticles([
      {
        id: "art-1",
        title: "Test Article",
        slug: "test-article",
        publishedAt: "2025-03-01T12:00:00Z",
        unpublishAt: null,
        coverImageUrl: "https://cdn.example.com/img.jpg",
      },
    ]);

    expect(result).toEqual([
      {
        type: "article",
        source: "editorial",
        id: "art-1",
        title: "Test Article",
        slug: "test-article",
        imageUrl: "https://cdn.example.com/img.jpg",
        date: "2025-03-01T12:00:00Z",
        excerpt: null,
      },
    ]);
  });

  it("handles empty/undefined input", () => {
    expect(mapEditorialArticles(undefined)).toEqual([]);
    expect(mapEditorialArticles([])).toEqual([]);
  });
});

describe("mapBffRelatedItems", () => {
  it("maps BFF RelatedItem[] to RelatedContentItem[]", () => {
    const result = mapBffRelatedItems([
      {
        id: "doc-1",
        slug: "some-article",
        type: "article" as const,
        score: 0.85,
        title: "AI Article",
        excerpt: "An excerpt",
        imageUrl: null,
      },
      {
        id: "doc-2",
        slug: "some-page",
        type: "page" as const,
        score: 0.72,
        title: "AI Page",
        excerpt: "Page excerpt",
        imageUrl: null,
      },
    ]);

    expect(result).toEqual([
      {
        type: "article",
        source: "ai",
        id: "doc-1",
        title: "AI Article",
        slug: "some-article",
        imageUrl: null,
        date: null,
        excerpt: "An excerpt",
      },
      {
        type: "page",
        source: "ai",
        id: "doc-2",
        title: "AI Page",
        slug: "some-page",
        imageUrl: null,
        excerpt: "Page excerpt",
      },
    ]);
  });

  it("passes imageUrl from BFF response to mapped article item", () => {
    const result = mapBffRelatedItems([
      {
        id: "doc-1",
        slug: "some-article",
        type: "article" as const,
        score: 0.85,
        title: "AI Article",
        excerpt: "An excerpt",
        imageUrl: "https://cdn.example.com/cover.jpg",
      },
    ]);

    expect(result[0]).toMatchObject({
      type: "article",
      imageUrl: "https://cdn.example.com/cover.jpg",
    });
  });

  it("handles empty input", () => {
    expect(mapBffRelatedItems([])).toEqual([]);
  });
});

describe("mapMentionedPlayers", () => {
  it("maps Sanity mentioned players to RelatedPlayerItem[]", () => {
    const result = mapMentionedPlayers([
      {
        _id: "player-1",
        firstName: "Kevin",
        lastName: "De Bruyne",
        position: "Middenvelder" as const,
        imageUrl: "https://cdn.example.com/kevin.jpg",
        psdId: "12345",
      },
    ]);

    expect(result).toEqual([
      {
        type: "player",
        source: "reference",
        id: "player-1",
        firstName: "Kevin",
        lastName: "De Bruyne",
        position: "Middenvelder",
        imageUrl: "https://cdn.example.com/kevin.jpg",
        psdId: "12345",
      },
    ]);
  });

  it("filters null entries and deduplicates", () => {
    const player = {
      _id: "player-1",
      firstName: "Kevin",
      lastName: "De Bruyne",
      position: "Middenvelder" as const,
      imageUrl: null,
      psdId: "12345",
    };
    const result = mapMentionedPlayers([null, player, player]);
    expect(result).toHaveLength(1);
  });
});

describe("mapMentionedTeams", () => {
  it("maps Sanity mentioned teams to RelatedTeamItem[]", () => {
    const result = mapMentionedTeams([
      {
        _id: "team-1",
        name: "KCVV Elewijt",
        imageUrl: "https://cdn.example.com/logo.png",
        slug: "kcvv-elewijt",
        tagline: "3e Nationale A",
      },
    ]);

    expect(result).toEqual([
      {
        type: "team",
        source: "reference",
        id: "team-1",
        name: "KCVV Elewijt",
        slug: "kcvv-elewijt",
        imageUrl: "https://cdn.example.com/logo.png",
        tagline: "3e Nationale A",
      },
    ]);
  });

  it("propagates a null tagline straight through (matches GROQ shape)", () => {
    const result = mapMentionedTeams([
      {
        _id: "team-1",
        name: "KCVV",
        imageUrl: null,
        slug: "kcvv",
        tagline: null,
      },
    ]);
    expect(result[0]).toMatchObject({ tagline: null });
  });

  it("filters null entries and deduplicates", () => {
    const team = {
      _id: "team-1",
      name: "KCVV",
      imageUrl: null,
      slug: "kcvv",
      tagline: null,
    };
    const result = mapMentionedTeams([null, team, team]);
    expect(result).toHaveLength(1);
  });
});

describe("mapMentionedStaff", () => {
  it("filters null entries and deduplicates", () => {
    const staff = {
      _id: "staff-1",
      firstName: "John",
      lastName: "Doe",
      imageUrl: "https://example.com/photo.jpg",
      psdImageUrl: null,
      role: null,
    };
    const result = mapMentionedStaff([null, staff, staff]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: "staff",
      source: "reference",
      id: "staff-1",
      firstName: "John",
      lastName: "Doe",
      role: null,
      imageUrl: "https://example.com/photo.jpg",
    });
  });

  it("maps Sanity mentioned staff to RelatedStaffItem[] with role from functionTitle", () => {
    const result = mapMentionedStaff([
      {
        _id: "staff-1",
        firstName: "John",
        lastName: "Doe",
        imageUrl: null,
        psdImageUrl: null,
        role: "Hoofdtrainer",
      },
    ]);

    expect(result).toEqual([
      {
        type: "staff",
        source: "reference",
        id: "staff-1",
        firstName: "John",
        lastName: "Doe",
        role: "Hoofdtrainer",
        imageUrl: null,
      },
    ]);
  });

  it("falls back to the sync-owned psdImage when the editorial photo is absent (#2895)", () => {
    const result = mapMentionedStaff([
      {
        _id: "staff-1",
        firstName: "John",
        lastName: "Doe",
        imageUrl: null,
        psdImageUrl: "https://example.com/psd-photo.jpg",
        role: "Hoofdtrainer",
      },
    ]);
    expect(result[0]?.imageUrl).toBe("https://example.com/psd-photo.jpg");
  });

  it("prefers the editorial photo over the sync-owned psdImage when both are present (#2895)", () => {
    const result = mapMentionedStaff([
      {
        _id: "staff-1",
        firstName: "John",
        lastName: "Doe",
        imageUrl: "https://example.com/photo.jpg",
        psdImageUrl: "https://example.com/psd-photo.jpg",
        role: "Hoofdtrainer",
      },
    ]);
    expect(result[0]?.imageUrl).toBe("https://example.com/photo.jpg");
  });
});

describe("mapCuratedRelatedContent", () => {
  it("maps a curated article entry with editorial source", () => {
    const result = mapCuratedRelatedContent([
      {
        _type: "article",
        _id: "art-1",
        title: "Curated piece",
        slug: "curated-piece",
        publishedAt: "2026-04-20T08:00:00Z",
        unpublishAt: null,
        coverImageUrl: "https://cdn.example.com/cover.jpg",
      },
    ]);

    expect(result).toEqual<RelatedArticleItem[]>([
      {
        type: "article",
        source: "editorial",
        id: "art-1",
        title: "Curated piece",
        slug: "curated-piece",
        imageUrl: "https://cdn.example.com/cover.jpg",
        date: "2026-04-20T08:00:00Z",
        excerpt: null,
      },
    ]);
  });

  it("maps a curated player entry with editorial source", () => {
    const result = mapCuratedRelatedContent([
      {
        _type: "player",
        _id: "player-9",
        firstName: "Lukas",
        lastName: "Vermeulen",
        position: "Aanvaller",
        imageUrl: "https://cdn.example.com/lukas.jpg",
        psdId: "9001",
      },
    ]);

    expect(result).toEqual<RelatedPlayerItem[]>([
      {
        type: "player",
        source: "editorial",
        id: "player-9",
        firstName: "Lukas",
        lastName: "Vermeulen",
        position: "Aanvaller",
        imageUrl: "https://cdn.example.com/lukas.jpg",
        psdId: "9001",
      },
    ]);
  });

  it("skips curated player entries without psdId (cannot link)", () => {
    const result = mapCuratedRelatedContent([
      {
        _type: "player",
        _id: "player-broken",
        firstName: "Anon",
        lastName: null,
        position: null,
        imageUrl: null,
        psdId: null,
      },
    ]);
    expect(result).toEqual([]);
  });

  it("handles undefined and empty inputs", () => {
    expect(mapCuratedRelatedContent(undefined)).toEqual([]);
    expect(mapCuratedRelatedContent(null)).toEqual([]);
    expect(mapCuratedRelatedContent([])).toEqual([]);
  });

  it("maps a curated team entry with editorial source", () => {
    const result = mapCuratedRelatedContent([
      {
        _type: "team",
        _id: "team-7",
        name: "Eerste Elftal A",
        slug: "eerste-elftal-a",
        imageUrl: "https://cdn.example.com/team-a.png",
        tagline: "3e Nationale A",
      },
    ]);

    expect(result).toEqual<RelatedTeamItem[]>([
      {
        type: "team",
        source: "editorial",
        id: "team-7",
        name: "Eerste Elftal A",
        slug: "eerste-elftal-a",
        imageUrl: "https://cdn.example.com/team-a.png",
        tagline: "3e Nationale A",
      },
    ]);
  });

  it("skips a curated team entry without name or slug (cannot route)", () => {
    const result = mapCuratedRelatedContent([
      {
        _type: "team",
        _id: "team-broken",
        name: null,
        slug: null,
        imageUrl: null,
        tagline: null,
      },
    ]);
    expect(result).toEqual([]);
  });

  it("maps a curated staffMember entry with editorial source", () => {
    const result = mapCuratedRelatedContent([
      {
        _type: "staffMember",
        _id: "staff-3",
        firstName: "Marc",
        lastName: "Vermeulen",
        imageUrl: "https://cdn.example.com/marc.jpg",
        psdImageUrl: null,
        role: "Hoofdtrainer",
      },
    ]);

    expect(result).toEqual<RelatedStaffItem[]>([
      {
        type: "staff",
        source: "editorial",
        id: "staff-3",
        firstName: "Marc",
        lastName: "Vermeulen",
        role: "Hoofdtrainer",
        imageUrl: "https://cdn.example.com/marc.jpg",
      },
    ]);
  });

  it("curated staffMember entry falls back to the sync-owned psdImage when the editorial photo is absent (#2895)", () => {
    const result = mapCuratedRelatedContent([
      {
        _type: "staffMember",
        _id: "staff-3",
        firstName: "Marc",
        lastName: "Vermeulen",
        imageUrl: null,
        psdImageUrl: "https://cdn.example.com/psd-marc.jpg",
        role: "Hoofdtrainer",
      },
    ]);
    expect((result[0] as RelatedStaffItem | undefined)?.imageUrl).toBe(
      "https://cdn.example.com/psd-marc.jpg",
    );
  });

  it("maps a curated event entry with editorial source", () => {
    const result = mapCuratedRelatedContent([
      {
        _type: "event",
        _id: "event-7",
        title: "Spaghetti-avond",
        slug: "spaghetti-avond",
        dateStart: "2026-05-15T18:00:00Z",
        dateEnd: "2026-05-15T22:00:00Z",
        coverImageUrl: "https://cdn.example.com/event.jpg",
      },
    ]);

    expect(result).toEqual<RelatedEventItem[]>([
      {
        type: "event",
        source: "editorial",
        id: "event-7",
        title: "Spaghetti-avond",
        slug: "spaghetti-avond",
        dateStart: "2026-05-15T18:00:00Z",
        dateEnd: "2026-05-15T22:00:00Z",
        imageUrl: "https://cdn.example.com/event.jpg",
      },
    ]);
  });

  it("preserves a null dateEnd on a curated event entry", () => {
    const result = mapCuratedRelatedContent([
      {
        _type: "event",
        _id: "event-8",
        title: "Vergadering",
        slug: "vergadering",
        dateStart: "2026-06-01T20:00:00Z",
        dateEnd: null,
        coverImageUrl: null,
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "event",
      dateStart: "2026-06-01T20:00:00Z",
      dateEnd: null,
      imageUrl: null,
    });
  });

  it("skips a curated event entry without dateStart (cannot render a card body)", () => {
    const result = mapCuratedRelatedContent([
      {
        _type: "event",
        _id: "event-broken",
        title: "Onbekend",
        slug: "onbekend",
        dateStart: "",
        dateEnd: null,
        coverImageUrl: null,
      },
    ]);
    expect(result).toEqual([]);
  });

  it("skips a curated event entry without slug (cannot route)", () => {
    const result = mapCuratedRelatedContent([
      {
        _type: "event",
        _id: "event-noslug",
        title: "Onbekend",
        slug: "",
        dateStart: "2026-06-01T20:00:00Z",
        dateEnd: null,
        coverImageUrl: null,
      },
    ]);
    expect(result).toEqual([]);
  });

  it("dedupes curated entries that share an _id, keeping the first occurrence", () => {
    const result = mapCuratedRelatedContent([
      {
        _type: "article",
        _id: "art-dup",
        title: "First copy",
        slug: "first-copy",
        publishedAt: "2026-04-20T08:00:00Z",
        unpublishAt: null,
        coverImageUrl: null,
      },
      {
        _type: "article",
        _id: "art-dup",
        title: "Second copy (should be ignored)",
        slug: "second-copy",
        publishedAt: "2026-04-21T08:00:00Z",
        unpublishAt: null,
        coverImageUrl: "https://cdn.example.com/should-not-win.jpg",
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "article",
      id: "art-dup",
      title: "First copy",
      slug: "first-copy",
    });
  });
});

describe("articleVMsToRelatedRowItems", () => {
  function makeArticle(
    overrides: Partial<ArticleVM> & { id: string },
  ): ArticleVM {
    return {
      title: `Artikel ${overrides.id}`,
      slug: `artikel-${overrides.id}`,
      publishedAt: "2026-05-01T10:00:00Z",
      featured: false,
      coverImageUrl: "https://cdn.example.com/cover.jpg",
      tags: [],
      articleType: null,
      subjects: null,
      firstTransferFact: null,
      firstEventFact: null,
      ...overrides,
    };
  }

  it("maps ArticleVM[] to reference-source article cards (parity with the retired related grid)", () => {
    const items = articleVMsToRelatedRowItems([
      makeArticle({ id: "a1", title: "Eerste", slug: "eerste" }),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "Eerste",
      href: "/nieuws/eerste",
      imageUrl: "https://cdn.example.com/cover.jpg",
      badge: "NIEUWS",
      // Analytics parity with <RelatedArticlesSection>: source "reference",
      // type "article", target_slug = the article slug.
      analyticsSource: "reference",
      analyticsType: "article",
      analyticsTargetSlug: "eerste",
      analyticsId: "a1",
    });
  });

  it("formats publishedAt as the card display date", () => {
    const [item] = articleVMsToRelatedRowItems([
      makeArticle({ id: "a1", publishedAt: "2026-05-01T10:00:00Z" }),
    ]);
    expect(item?.date).toBe(formatArticleDate("2026-05-01T10:00:00Z"));
  });

  it("preserves source order across multiple articles", () => {
    const items = articleVMsToRelatedRowItems([
      makeArticle({ id: "a1", slug: "een" }),
      makeArticle({ id: "a2", slug: "twee" }),
      makeArticle({ id: "a3", slug: "drie" }),
    ]);
    expect(items.map((i) => i.href)).toEqual([
      "/nieuws/een",
      "/nieuws/twee",
      "/nieuws/drie",
    ]);
  });

  it("returns an empty array for no related articles (row auto-hides)", () => {
    expect(articleVMsToRelatedRowItems([])).toEqual([]);
  });
});

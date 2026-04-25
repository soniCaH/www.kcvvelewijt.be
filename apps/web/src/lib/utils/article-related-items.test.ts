import { describe, it, expect } from "vitest";
import {
  mapEditorialArticles,
  mapBffRelatedItems,
  mapMentionedPlayers,
  mapMentionedTeams,
  mapMentionedStaff,
  mapCuratedRelatedContent,
  mergeRelatedItems,
} from "./article-related-items";
import type {
  RelatedArticleItem,
  RelatedPlayerItem,
} from "@/components/related/types";

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
        tagline: null,
      },
    ]);
  });

  it("filters null entries and deduplicates", () => {
    const team = {
      _id: "team-1",
      name: "KCVV",
      imageUrl: null,
      slug: "kcvv",
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

  it("maps Sanity mentioned staff to RelatedStaffItem[]", () => {
    const result = mapMentionedStaff([
      {
        _id: "staff-1",
        firstName: "John",
        lastName: "Doe",
        imageUrl: null,
      },
    ]);

    expect(result).toEqual([
      {
        type: "staff",
        source: "reference",
        id: "staff-1",
        firstName: "John",
        lastName: "Doe",
        role: null,
        imageUrl: null,
      },
    ]);
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
});

describe("mergeRelatedItems", () => {
  const curatedPlayer: RelatedPlayerItem = {
    type: "player",
    source: "editorial",
    id: "player-1",
    firstName: "Jan",
    lastName: "Janssens",
    position: "Aanvaller",
    imageUrl: null,
    psdId: "12345",
  };
  const mentionedSamePlayer: RelatedPlayerItem = {
    ...curatedPlayer,
    source: "reference",
  };
  const mentionedOtherPlayer: RelatedPlayerItem = {
    type: "player",
    source: "reference",
    id: "player-2",
    firstName: "Piet",
    lastName: "Pieters",
    position: "Verdediger",
    imageUrl: null,
    psdId: "67890",
  };
  const editorialArticle: RelatedArticleItem = {
    type: "article",
    source: "editorial",
    id: "art-1",
    title: "Article one",
    slug: "article-one",
    imageUrl: null,
    date: null,
    excerpt: null,
  };

  it("places curated entries first and drops auto-derived duplicates by id", () => {
    const result = mergeRelatedItems({
      curated: [curatedPlayer],
      auto: [editorialArticle, mentionedSamePlayer, mentionedOtherPlayer],
    });

    expect(result).toEqual([
      curatedPlayer,
      editorialArticle,
      mentionedOtherPlayer,
    ]);
  });

  it("keeps all auto-derived entries when no curated overlap", () => {
    const result = mergeRelatedItems({
      curated: [],
      auto: [editorialArticle, mentionedSamePlayer, mentionedOtherPlayer],
    });

    expect(result).toEqual([
      editorialArticle,
      mentionedSamePlayer,
      mentionedOtherPlayer,
    ]);
  });

  it("returns an empty array when curated and auto are both empty", () => {
    expect(mergeRelatedItems({ curated: [], auto: [] })).toEqual([]);
  });

  it("dedupes a curated player against the same player surfaced via mentioned-players", () => {
    const sharedId = "player-shared";
    const sharedPsdId = "9999";

    const curated = mapCuratedRelatedContent([
      {
        _type: "player",
        _id: sharedId,
        firstName: "Shared",
        lastName: "Player",
        position: "Middenvelder",
        imageUrl: null,
        psdId: sharedPsdId,
      },
    ]);
    const mentioned = mapMentionedPlayers([
      {
        _id: sharedId,
        firstName: "Shared",
        lastName: "Player",
        position: "Middenvelder",
        imageUrl: null,
        psdId: sharedPsdId,
      },
    ]);

    const merged = mergeRelatedItems({ curated, auto: [...mentioned] });

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      type: "player",
      source: "editorial",
      id: sharedId,
    });
  });
});

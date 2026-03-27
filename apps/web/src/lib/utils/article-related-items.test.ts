import { describe, it, expect } from "vitest";
import {
  mapEditorialArticles,
  mapBffRelatedItems,
  mapMentionedPlayers,
  mapMentionedTeams,
  mapMentionedStaff,
} from "./article-related-items";

describe("mapEditorialArticles", () => {
  it("maps RelatedArticleRef[] to RelatedArticleItem[]", () => {
    const result = mapEditorialArticles([
      {
        id: "art-1",
        title: "Test Article",
        slug: "test-article",
        publishedAt: "2025-03-01T12:00:00Z",
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
      positionTitle: "Coach",
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
      role: "Coach",
      imageUrl: "https://example.com/photo.jpg",
    });
  });

  it("maps Sanity mentioned staff to RelatedStaffItem[]", () => {
    const result = mapMentionedStaff([
      {
        _id: "staff-1",
        firstName: "John",
        lastName: "Doe",
        positionTitle: "Coach",
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
        role: "Coach",
        imageUrl: null,
      },
    ]);
  });
});

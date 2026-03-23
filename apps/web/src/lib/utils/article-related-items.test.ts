import { describe, it, expect } from "vitest";
import {
  mapEditorialArticles,
  mapBffRelatedItems,
  mapMentionedPlayers,
  mapMentionedTeams,
  mapMentionedStaff,
} from "./article-related-items";

describe("mapEditorialArticles", () => {
  it("maps Sanity relatedArticles to RelatedArticleItem[]", () => {
    const result = mapEditorialArticles([
      {
        _id: "art-1",
        title: "Test Article",
        slug: { current: "test-article" },
        publishAt: "2025-03-01T12:00:00Z",
        coverImageUrl: "https://cdn.example.com/img.jpg",
        featured: false,
        tags: [],
        body: [],
      },
    ]);

    expect(result).toEqual([
      {
        type: "article",
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
      },
      {
        id: "doc-2",
        slug: "some-page",
        type: "page" as const,
        score: 0.72,
        title: "AI Page",
        excerpt: "Page excerpt",
      },
    ]);

    expect(result).toEqual([
      {
        type: "article",
        id: "doc-1",
        title: "AI Article",
        slug: "some-article",
        imageUrl: null,
        date: null,
        excerpt: "An excerpt",
      },
      {
        type: "page",
        id: "doc-2",
        title: "AI Page",
        slug: "some-page",
        imageUrl: null,
        excerpt: "Page excerpt",
      },
    ]);
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
        position: "Midfielder",
        imageUrl: "https://cdn.example.com/kevin.jpg",
        psdId: "12345",
      },
    ]);

    expect(result).toEqual([
      {
        type: "player",
        id: "player-1",
        firstName: "Kevin",
        lastName: "De Bruyne",
        position: "Midfielder",
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
      position: "Midfielder",
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
        id: "staff-1",
        firstName: "John",
        lastName: "Doe",
        role: "Coach",
        imageUrl: null,
      },
    ]);
  });
});

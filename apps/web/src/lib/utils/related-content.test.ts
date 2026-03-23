import { describe, it, expect } from "vitest";
import {
  buildRelatedContent,
  type MentionedPlayer,
  type MentionedTeam,
} from "./related-content";
import type { RelatedContent } from "@/components/article";

describe("buildRelatedContent", () => {
  const relatedArticles = [
    { title: "Article One", slug: { current: "article-one" } },
    { title: "Article Two", slug: { current: "article-two" } },
  ];

  const mentionedPlayers: MentionedPlayer[] = [
    {
      _id: "player-1",
      firstName: "Jan",
      lastName: "Janssens",
      position: "Aanvaller",
      imageUrl: null,
      psdId: "123",
    },
  ];

  const mentionedTeams: MentionedTeam[] = [
    {
      _id: "team-1",
      name: "A-ploeg",
      imageUrl: null,
      slug: "a-ploeg",
    },
  ];

  it("orders items as articles → players → teams", () => {
    const result = buildRelatedContent({
      relatedArticles,
      mentionedPlayers,
      mentionedTeams,
    });

    expect(result).toEqual<RelatedContent[]>([
      { title: "Article One", href: "/news/article-one", type: "article" },
      { title: "Article Two", href: "/news/article-two", type: "article" },
      { title: "Jan Janssens", href: "/players/123", type: "player" },
      { title: "A-ploeg", href: "/team/a-ploeg", type: "team" },
    ]);
  });

  it("deduplicates players and teams by _id", () => {
    const duplicatePlayers: MentionedPlayer[] = [
      {
        _id: "player-1",
        firstName: "Jan",
        lastName: "Janssens",
        position: "Aanvaller",
        imageUrl: null,
        psdId: "123",
      },
      {
        _id: "player-1",
        firstName: "Jan",
        lastName: "Janssens",
        position: "Aanvaller",
        imageUrl: null,
        psdId: "123",
      },
      {
        _id: "player-2",
        firstName: "Piet",
        lastName: "Pieters",
        position: "Verdediger",
        imageUrl: null,
        psdId: "456",
      },
    ];
    const duplicateTeams: MentionedTeam[] = [
      { _id: "team-1", name: "A-ploeg", imageUrl: null, slug: "a-ploeg" },
      { _id: "team-1", name: "A-ploeg", imageUrl: null, slug: "a-ploeg" },
    ];

    const result = buildRelatedContent({
      mentionedPlayers: duplicatePlayers,
      mentionedTeams: duplicateTeams,
    });

    expect(result).toEqual<RelatedContent[]>([
      { title: "Jan Janssens", href: "/players/123", type: "player" },
      { title: "Piet Pieters", href: "/players/456", type: "player" },
      { title: "A-ploeg", href: "/team/a-ploeg", type: "team" },
    ]);
  });

  it("returns empty array when no related content exists", () => {
    const result = buildRelatedContent({});
    expect(result).toEqual([]);
  });

  it("handles undefined mentionedPlayers and mentionedTeams", () => {
    const result = buildRelatedContent({
      relatedArticles,
      mentionedPlayers: undefined,
      mentionedTeams: undefined,
    });

    expect(result).toEqual<RelatedContent[]>([
      { title: "Article One", href: "/news/article-one", type: "article" },
      { title: "Article Two", href: "/news/article-two", type: "article" },
    ]);
  });

  it("filters out articles with missing slugs", () => {
    const result = buildRelatedContent({
      relatedArticles: [
        { title: "Good", slug: { current: "good" } },
        { title: "Bad", slug: null as unknown as { current: string } },
      ],
    });

    expect(result).toEqual<RelatedContent[]>([
      { title: "Good", href: "/news/good", type: "article" },
    ]);
  });
});

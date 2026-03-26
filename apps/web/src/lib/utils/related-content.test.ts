import { describe, it, expect } from "vitest";
import {
  buildRelatedContent,
  type MentionedPlayer,
  type MentionedStaffMember,
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

  const mentionedStaffMembers: MentionedStaffMember[] = [
    {
      _id: "staff-1",
      firstName: "Marc",
      lastName: "De Trainer",
      positionTitle: "Hoofdtrainer",
      imageUrl: null,
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

  it("orders items as articles → players → staff → teams", () => {
    const result = buildRelatedContent({
      relatedArticles,
      mentionedPlayers,
      mentionedStaffMembers,
      mentionedTeams,
    });

    expect(result).toEqual<RelatedContent[]>([
      { title: "Article One", href: "/nieuws/article-one", type: "article" },
      { title: "Article Two", href: "/nieuws/article-two", type: "article" },
      { title: "Jan Janssens", href: "/spelers/123", type: "player" },
      {
        title: "Marc De Trainer",
        href: "/club/organigram?member=staff-1",
        type: "staff",
      },
      { title: "A-ploeg", href: "/ploegen/a-ploeg", type: "team" },
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
      { title: "Jan Janssens", href: "/spelers/123", type: "player" },
      { title: "Piet Pieters", href: "/spelers/456", type: "player" },
      { title: "A-ploeg", href: "/ploegen/a-ploeg", type: "team" },
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
      { title: "Article One", href: "/nieuws/article-one", type: "article" },
      { title: "Article Two", href: "/nieuws/article-two", type: "article" },
    ]);
  });

  it("filters out null entries from broken references", () => {
    const result = buildRelatedContent({
      mentionedPlayers: [
        null as unknown as MentionedPlayer,
        {
          _id: "player-1",
          firstName: "Jan",
          lastName: "Janssens",
          position: "Aanvaller",
          imageUrl: null,
          psdId: "123",
        },
      ],
      mentionedTeams: [
        null as unknown as MentionedTeam,
        { _id: "team-1", name: "A-ploeg", imageUrl: null, slug: "a-ploeg" },
      ],
    });

    expect(result).toEqual<RelatedContent[]>([
      { title: "Jan Janssens", href: "/spelers/123", type: "player" },
      { title: "A-ploeg", href: "/ploegen/a-ploeg", type: "team" },
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
      { title: "Good", href: "/nieuws/good", type: "article" },
    ]);
  });
});

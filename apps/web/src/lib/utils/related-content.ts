import type { RelatedContent } from "@/components/article";

export interface MentionedPlayer {
  _id: string;
  firstName: string | null;
  lastName: string | null;
  position: string | null;
  imageUrl: string | null;
  psdId: string;
}

export interface MentionedTeam {
  _id: string;
  name: string;
  imageUrl: string | null;
  slug: string;
}

export interface MentionedStaffMember {
  _id: string;
  firstName: string | null;
  lastName: string | null;
  positionTitle: string | null;
  imageUrl: string | null;
}

interface BuildRelatedContentInput {
  relatedArticles?: Array<{ title: string; slug: { current: string } }>;
  mentionedPlayers?: Array<MentionedPlayer | null>;
  mentionedTeams?: Array<MentionedTeam | null>;
  mentionedStaffMembers?: Array<MentionedStaffMember | null>;
}

function deduplicateById<T extends { _id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item._id)) return false;
    seen.add(item._id);
    return true;
  });
}

export function buildRelatedContent(
  input: BuildRelatedContentInput,
): RelatedContent[] {
  const articles: RelatedContent[] = (input.relatedArticles ?? [])
    .filter((a) => a?.slug?.current)
    .map((a) => ({
      title: a.title,
      href: `/news/${a.slug.current}`,
      type: "article" as const,
    }));

  const uniquePlayers = deduplicateById(
    (input.mentionedPlayers ?? []).filter(
      (p): p is MentionedPlayer => p != null,
    ),
  );
  const players: RelatedContent[] = uniquePlayers.map((p) => ({
    title: [p.firstName, p.lastName].filter(Boolean).join(" "),
    href: `/players/${p.psdId}`,
    type: "player" as const,
  }));

  const uniqueStaff = deduplicateById(
    (input.mentionedStaffMembers ?? []).filter(
      (s): s is MentionedStaffMember => s != null,
    ),
  );
  const staff: RelatedContent[] = uniqueStaff.map((s) => ({
    title: [s.firstName, s.lastName].filter(Boolean).join(" "),
    href: `/club/organigram?member=${s._id}`,
    type: "staff" as const,
  }));

  const uniqueTeams = deduplicateById(
    (input.mentionedTeams ?? []).filter((t): t is MentionedTeam => t != null),
  );
  const teams: RelatedContent[] = uniqueTeams.map((t) => ({
    title: t.name,
    href: `/team/${t.slug}`,
    type: "team" as const,
  }));

  return [...articles, ...players, ...staff, ...teams];
}

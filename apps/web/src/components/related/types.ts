/** Discriminated union for all related content item types */

export type RelatedContentSource = "editorial" | "ai" | "reference";

export type RelatedPageType =
  | "article"
  | "page"
  | "player"
  | "team"
  | "staff"
  | "event";

export interface RelatedArticleItem {
  type: "article";
  source: RelatedContentSource;
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  date: string | null;
  excerpt: string | null;
}

export interface RelatedPageItem {
  type: "page";
  source: RelatedContentSource;
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  excerpt: string | null;
}

export interface RelatedPlayerItem {
  type: "player";
  source: RelatedContentSource;
  id: string;
  firstName: string | null;
  lastName: string | null;
  position: string | null;
  imageUrl: string | null;
  psdId: string;
}

export interface RelatedTeamItem {
  type: "team";
  source: RelatedContentSource;
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  tagline: string | null;
}

export interface RelatedStaffItem {
  type: "staff";
  source: RelatedContentSource;
  id: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  imageUrl: string | null;
}

export interface RelatedEventItem {
  type: "event";
  source: RelatedContentSource;
  id: string;
  title: string;
  slug: string;
  /** Required ISO datetime — events without a start have nothing to render. */
  dateStart: string;
  /** Optional ISO end datetime; same-day single events typically omit it. */
  dateEnd: string | null;
  imageUrl: string | null;
}

export type RelatedContentItem =
  | RelatedArticleItem
  | RelatedPageItem
  | RelatedPlayerItem
  | RelatedTeamItem
  | RelatedStaffItem
  | RelatedEventItem;

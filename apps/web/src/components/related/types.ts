/** Discriminated union for all related content item types */

export interface RelatedArticleItem {
  type: "article";
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  date: string | null;
  excerpt: string | null;
}

export interface RelatedPageItem {
  type: "page";
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  excerpt: string | null;
}

export interface RelatedPlayerItem {
  type: "player";
  id: string;
  firstName: string | null;
  lastName: string | null;
  position: string | null;
  imageUrl: string | null;
  psdId: string;
}

export interface RelatedTeamItem {
  type: "team";
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  tagline: string | null;
}

export interface RelatedStaffItem {
  type: "staff";
  id: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  imageUrl: string | null;
}

export type RelatedContentItem =
  | RelatedArticleItem
  | RelatedPageItem
  | RelatedPlayerItem
  | RelatedTeamItem
  | RelatedStaffItem;

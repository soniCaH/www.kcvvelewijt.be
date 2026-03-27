import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type { JEUGD_LANDING_PAGE_QUERY_RESULT } from "../sanity/sanity.types";

// ─── GROQ Query ──────────────────────────────────────────────────────────────

export const JEUGD_LANDING_PAGE_QUERY =
  defineQuery(`*[_type == "jeugdLandingPage"][0] {
  editorialCards[] {
    tag, title, description, arrowText, href,
    "imageUrl": image.asset->url + "?w=900&q=80&fm=webp",
    position, cardType
  }
}`);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EditorialCardConfig {
  tag: string | null;
  title: string | null;
  description: string | null;
  arrowText: string | null;
  href: string | null;
  imageUrl: string | null;
  position: "featured" | "medium" | "third";
  cardType: "nav" | "article" | null;
}

// ─── Mapping ─────────────────────────────────────────────────────────────────

type RawCard = NonNullable<
  NonNullable<JEUGD_LANDING_PAGE_QUERY_RESULT>["editorialCards"]
>[number];

function toEditorialCardConfig(card: RawCard): EditorialCardConfig | null {
  if (
    card.position !== "featured" &&
    card.position !== "medium" &&
    card.position !== "third"
  ) {
    return null;
  }
  return {
    tag: card.tag,
    title: card.title,
    description: card.description,
    arrowText: card.arrowText,
    href: card.href,
    imageUrl: card.imageUrl,
    position: card.position,
    cardType: card.cardType,
  };
}

export function toEditorialCardsVM(
  data: JEUGD_LANDING_PAGE_QUERY_RESULT,
): EditorialCardConfig[] | null {
  if (!data || !data.editorialCards) return null;
  const cards = data.editorialCards
    .map(toEditorialCardConfig)
    .filter((c): c is EditorialCardConfig => c !== null);
  return cards;
}

// ─── Repository ──────────────────────────────────────────────────────────────

export interface JeugdLandingPageRepositoryInterface {
  readonly getEditorialCards: () => Effect.Effect<EditorialCardConfig[] | null>;
}

export class JeugdLandingPageRepository extends Context.Tag(
  "JeugdLandingPageRepository",
)<JeugdLandingPageRepository, JeugdLandingPageRepositoryInterface>() {}

export const JeugdLandingPageRepositoryLive = Layer.succeed(
  JeugdLandingPageRepository,
  {
    getEditorialCards: () =>
      fetchGroq<JEUGD_LANDING_PAGE_QUERY_RESULT>(JEUGD_LANDING_PAGE_QUERY).pipe(
        Effect.map(toEditorialCardsVM),
      ),
  },
);

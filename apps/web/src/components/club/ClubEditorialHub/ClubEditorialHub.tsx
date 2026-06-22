import { EditorialHubCard } from "@/components/editorial/EditorialHubCard/EditorialHubCard";
import {
  NavGlyph,
  type NavGlyphName,
} from "@/components/editorial/NavGlyph/NavGlyph";
import { EditorialHeading } from "@/components/design-system";
import { HISTORY_24_25_CARD, ULTRAS_HEADER_CARD } from "@/lib/sanity/images";

interface ClubHubNewsCard {
  variant: "news";
  tag: string;
  href: string;
  title: string;
  arrowText: string;
  /** Newsprint-colour cover photo. */
  imageUrl: string;
}

interface ClubHubNavCard {
  variant: "nav";
  tag: string;
  href: string;
  title: string;
  arrowText: string;
  /** Phosphor-fill glyph rendered on the jersey-deep nav panel. */
  iconName: NavGlyphName;
}

export type ClubHubCard = ClubHubNewsCard | ClubHubNavCard;

/**
 * The six pinned `/club` index cards (design lock 10c3). Three `news` cards
 * carry a newsprint cover photo (Geschiedenis · Ultras · Aansluiten); three
 * `nav` cards carry a Phosphor-fill glyph panel (Bestuur · Organigram ·
 * Angels). Source order = render order.
 */
export const CLUB_HUB_CARDS: ClubHubCard[] = [
  {
    variant: "news",
    tag: "Geschiedenis",
    href: "/club/geschiedenis",
    title: "Meer dan een eeuw voetbalpassie",
    arrowText: "Lees verder",
    imageUrl: HISTORY_24_25_CARD,
  },
  {
    variant: "nav",
    tag: "Bestuur",
    href: "/club/bestuur",
    title: "Het team achter het team",
    arrowText: "Ontdek",
    iconName: "UsersThree",
  },
  {
    variant: "nav",
    tag: "Organigram",
    href: "/hulp#structuur",
    title: "Onze structuur",
    arrowText: "Zoek het op",
    iconName: "TreeStructure",
  },
  {
    variant: "news",
    tag: "Ultras",
    href: "/club/ultras",
    title: "De 12de man",
    arrowText: "Ontdek",
    imageUrl: ULTRAS_HEADER_CARD,
  },
  {
    variant: "nav",
    tag: "Angels",
    href: "/club/angels",
    title: "Onze engelen",
    arrowText: "Ontdek",
    iconName: "Heart",
  },
  {
    variant: "news",
    tag: "Aansluiten",
    href: "/club/word-lid",
    title: "Word lid",
    arrowText: "Schrijf je in",
    imageUrl: "/images/youth-trainers.jpg",
  },
];

export interface ClubEditorialHubProps {
  /**
   * The cards to render. Defaults to the production `CLUB_HUB_CARDS`; the prop
   * exists so Storybook can inject local cover assets for deterministic VR.
   */
  cards?: ClubHubCard[];
}

/**
 * <ClubEditorialHub> — the `/club` index nav hub (design lock 10c3): a uniform
 * 3-up grid of 16:9 `<EditorialHubCard>`s under a "Dit is KCVV." header.
 * Mirrors `<JeugdEditorialGrid>` (same uniform grid, same card primitive) but
 * the `/club` cards are static — no article bubbling. Supersedes the retired
 * bento-style `<ClubEditorialGrid>` + `<EditorialCard>`.
 */
export function ClubEditorialHub({
  cards = CLUB_HUB_CARDS,
}: ClubEditorialHubProps) {
  return (
    <div>
      <EditorialHeading
        level={2}
        size="display-lg"
        emphasis={{ text: "KCVV" }}
        className="mb-8"
      >
        Dit is KCVV
      </EditorialHeading>
      <div
        data-testid="club-editorial-hub"
        className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {cards.map((card) => (
          <div key={card.href} className="h-full">
            <EditorialHubCard
              variant={card.variant}
              href={card.href}
              tag={card.tag}
              title={card.title}
              arrowText={card.arrowText}
              imageUrl={card.variant === "news" ? card.imageUrl : undefined}
              icon={
                card.variant === "nav" ? (
                  <NavGlyph name={card.iconName} />
                ) : undefined
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

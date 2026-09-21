import { EditorialHubCard } from "@/components/editorial/EditorialHubCard/EditorialHubCard";
import {
  NavGlyph,
  type NavGlyphName,
} from "@/components/editorial/NavGlyph/NavGlyph";
import { EditorialHeading, TapedCardGrid } from "@/components/design-system";
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
 * The twelve pinned `/club` index cards (4 rows of 3, design lock 10c3 +
 * #2208). Three `news` cards carry a newsprint cover photo (Geschiedenis ·
 * Ultras · Aansluiten); nine `nav` cards carry a Phosphor-fill glyph panel.
 *
 * **Source order = render order** — reordering the hub means moving an entry in
 * this array, nothing else. The three `news` cards are spaced one per row so no
 * row above the fold is glyph-only.
 *
 * A `nav` card gets a photo through the shared primitive, not by becoming a
 * `news` card: `<EditorialHubCard variant="nav" imageUrl="…">` renders the
 * photo behind a `jersey-deep-dark` scrim with the glyph and pill kept on top
 * — the one recipe for a photographic nav tile, see `EditorialHubCard`'s own
 * docblock and DESIGN.md § The Imageless Card → "No Filler Photo, Ever Rule"
 * (#2965). `ClubHubNavCard` above carries no `imageUrl` field yet, so wiring
 * one through is the actual change here, not a `variant` flip — this
 * docblock states the recipe, it doesn't add the field. Either change needs
 * a scoped VR re-capture of `features-club-clubeditorialhub`.
 *
 * The hub must stay a superset of the `De club` dropdown — #2409 deletes that
 * panel and relies on this grid to index the same routes. Jeugdbestuur ·
 * Vrijwilligers · Contact close that gap (#2414);
 * `nav-reachability.test.ts` is the guard.
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
    tag: "Jeugdbestuur",
    href: "/club/jeugdbestuur",
    title: "Wie de jeugd draaiende houdt",
    arrowText: "Ontdek",
    iconName: "SoccerBall",
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
  {
    variant: "nav",
    tag: "Downloads",
    href: "/club/downloads",
    title: "Documenten & formulieren",
    arrowText: "Ontdek",
    iconName: "DownloadSimple",
  },
  {
    variant: "nav",
    tag: "Praktisch",
    href: "/club/praktische-informatie",
    title: "Alles wat je moet weten",
    arrowText: "Ontdek",
    iconName: "Info",
  },
  {
    variant: "nav",
    tag: "Vrijwilligers",
    href: "/club/vrijwilliger",
    title: "Steek een handje toe",
    arrowText: "Doe mee",
    iconName: "Handshake",
  },
  {
    variant: "nav",
    tag: "Cashless",
    href: "/club/cashless",
    title: "De digitale clubkaart",
    arrowText: "Ontdek",
    iconName: "Ticket",
  },
  {
    variant: "nav",
    tag: "Contact",
    href: "/club/contact",
    title: "Vind ons terug",
    arrowText: "Neem contact op",
    iconName: "Envelope",
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
      <TapedCardGrid columns={3} gap="sm">
        {cards.map((card) => (
          <EditorialHubCard
            key={card.href}
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
        ))}
      </TapedCardGrid>
    </div>
  );
}

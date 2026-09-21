import { EditorialHubCard } from "@/components/editorial/EditorialHubCard/EditorialHubCard";
import {
  NavGlyph,
  type NavGlyphName,
} from "@/components/editorial/NavGlyph/NavGlyph";
import { SectionKicker, TapedCardGrid } from "@/components/design-system";
import { hashMemberId } from "@/lib/analytics/hash-member-id";
import type { ArticleVM } from "@/lib/repositories/article.repository";
import type { EditorialCardConfig } from "@/lib/repositories/jeugd-landing-page.repository";

interface NavCardConfig {
  tag: string;
  title: string;
  arrowText: string;
  href: string;
  iconName: NavGlyphName;
  /** Document target, not a route — renders a plain anchor (#2960). */
  external?: boolean;
  /**
   * Nav-tile photo (#2965). `apps/web/public/images/jeugd/…` — chrome, not
   * Sanity: reusing an article's asset would mean an editor deleting that
   * article breaks a nav tile. Present → photo behind a `jersey-deep-dark`
   * scrim; absent (the default) → today's flat `bg-jersey-deep` + glyph,
   * unchanged. No filler photo for a tile with none — an honest icon beats a
   * generic photo that says nothing (owner decision, #2965).
   */
  image?: string;
}

/**
 * The six pinned nav cards (7j0b targets). Each carries its own Phosphor-fill
 * glyph for the nav-variant panel.
 *
 * Targets as of #2960: `word lid` → `/club/word-lid` (membership form is
 * #1473); the Visie slot is now the leerplan PDF, not the `#visie` anchor;
 * `prosoccerdata` and `medisch` deep-link into `<HulpFinder>` rather than
 * defaulting to the bare hub. Exactly one card — "Wie contacteer ik?" —
 * still points at `/hulp`, because the search box is its whole job; a second
 * one is the duplicate #2965 was filed for, and a test asserts the count.
 *
 * Three of the six carry a day-one `image` (#2965): "Word lid van KCVV",
 * "Ons leerplan" and "Trainingen & ProSoccerData" — the three with a
 * defensible photo in the library today. The other three ("Organigram",
 * "Wie contacteer ik?", "Blessure of medisch attest?") have none: no photo
 * exists that actually depicts those, and a generic stand-in reads worse
 * than the flat green + glyph they keep.
 */
const NAV_CARDS: NavCardConfig[] = [
  {
    tag: "Aansluiten",
    title: "Word lid van KCVV",
    arrowText: "Schrijf je in",
    href: "/club/word-lid",
    iconName: "UsersThree",
    // Owner-approved stand-in pending final sign-off (#2965) — see PR body.
    image: "/images/jeugd/word-lid-kids-met-bal.jpg",
  },
  {
    tag: "Visie",
    // #2960: was a tile linking `/jeugd#visie` — an anchor on this same page
    // that scrolls to a single sentence. The leerplan is the long form of
    // that promise: the full jeugdopleiding curriculum, and the club's
    // most-searched document (17 clicks / 695 impressions a year). It lived
    // only on the legacy Drupal host until this change.
    title: "Ons leerplan",
    arrowText: "Download",
    href: "/downloads/leerplan-jeugdopleiding-2019.pdf",
    iconName: "DownloadSimple",
    external: true,
    // Owner-approved stand-in pending final sign-off (#2965) — see PR body.
    image: "/images/jeugd/leerplan-jeugdtraining.jpg",
  },
  {
    tag: "Praktisch",
    title: "Trainingen & ProSoccerData",
    arrowText: "Zoek het op",
    // #2963 repointed this off `/nieuws/prosoccerdata`, an article that never
    // existed. #2960 takes it the rest of the way: `<HulpFinder>` makes every
    // card `#<slug>` deep-linkable, and a direct hit scrolls to the card AND
    // expands its answer — verified against production. So this lands on the
    // answer itself, not on the hub's search box.
    href: "/hulp#prosoccerdata-gebruiken",
    iconName: "SoccerBall",
    // Owner-approved stand-in pending final sign-off (#2965) — see PR body.
    image: "/images/jeugd/trainingen-drie-trainers.jpg",
  },
  {
    tag: "Structuur",
    title: "Organigram",
    arrowText: "Zoek het op",
    href: "/hulp#structuur",
    iconName: "TreeStructure",
  },
  {
    tag: "Hulp",
    title: "Wie contacteer ik?",
    arrowText: "Zoek het op",
    href: "/hulp",
    iconName: "MagnifyingGlass",
  },
  {
    tag: "Medisch",
    // #2960: `?categorie=` filters the finder, so this lands on the three
    // medical hulpvragen (AED/EHBO, allergieën/medicatie, medisch attest)
    // instead of the bare hub — which is what made this tile read as a
    // duplicate of "Wie contacteer ik?" below.
    //
    // Title was "Blessure of afmelding?" until #2960. Afmelden happens in
    // ProSoccerData (owner, 2026-09-15), not here — and no hulpvraag covers
    // it either: 37 active responsibilities, none about telling the club you
    // cannot come, and `prosoccerdata-gebruiken` is about logins only. The
    // old title promised an answer no target gave. The medical set it does
    // reach is AED/EHBO, allergieën/medicatie and medisch attest.
    // Authoring an "afmelden via ProSoccerData" vraag is tracked on #2965.
    title: "Blessure of medisch attest?",
    arrowText: "Zoek het op",
    // The `#hulp` hash is load-bearing: `<HulpFinder>` only scrolls on a
    // `#<slug>` reveal or "see all", so `?categorie=` alone lands the visitor
    // on the hero with the search box — the exact bare-hub impression this
    // change removes. Measured on production: y=0 without it, y=493 with.
    href: "/hulp?categorie=medisch#hulp",
    iconName: "FirstAid",
  },
];

/**
 * Fallback glyph for Sanity-driven nav cards. `editorialCards` carries no
 * `icon` field (no schema change in 7j3), so an editor-configured nav card
 * cannot pick a per-card glyph — it renders this neutral default. Per-card nav
 * glyphs require the hardcoded set (or a future `icon` schema field).
 */
const DEFAULT_NAV_GLYPH: NavGlyphName = "House";

function assertNever(value: never): never {
  throw new Error(`Unhandled editorialCards.cardType: ${String(value)}`);
}

function renderNavCard(nav: NavCardConfig): React.ReactNode {
  return (
    <EditorialHubCard
      key={`nav-${nav.tag.toLowerCase()}`}
      variant="nav"
      href={nav.href}
      tag={nav.tag}
      title={nav.title}
      arrowText={nav.arrowText}
      icon={<NavGlyph name={nav.iconName} />}
      imageUrl={nav.image}
      external={nav.external}
    />
  );
}

function renderArticleCard(article: ArticleVM): React.ReactNode {
  return (
    <EditorialHubCard
      key={`article-${article.id}`}
      variant="news"
      href={`/nieuws/${article.slug}`}
      // News/article cards carry their own tag (7j3 data audit): the article's
      // first tag, falling back to the constant `Jeugd`. `editorialCards.tag`
      // is NOT read for article slots.
      tag={article.tags[0] ?? "Jeugd"}
      title={article.title}
      arrowText="Lees verder"
      imageUrl={article.coverImageUrl ?? undefined}
      // Hashed id for `jeugd_card_click` analytics (no PII / no raw id in DOM).
      articleIdHashed={hashMemberId(article.id)}
      // Decorative — the title is the link's accessible name, so an alt would
      // duplicate it.
    />
  );
}

function buildItemsFromConfig(
  config: EditorialCardConfig[],
  articles: ArticleVM[],
): React.ReactNode[] {
  const items: React.ReactNode[] = [];
  let articleIdx = 0;

  for (let i = 0; i < config.length; i++) {
    const entry = config[i];

    if (entry.cardType === "article") {
      // Article slots bubble: fill with the latest Jeugd articles in order.
      const article = articles[articleIdx++];
      if (!article) continue;
      items.push(renderArticleCard(article));
    } else if (entry.cardType === "nav") {
      // Nav card — skip if required fields are missing.
      if (!entry.title || !entry.href) continue;
      items.push(
        <EditorialHubCard
          key={`nav-sanity-${i}`}
          variant="nav"
          href={entry.href}
          // Sanity nav cards: CMS `tag` when set, else an empty pill (7j3).
          tag={entry.tag ?? ""}
          title={entry.title}
          arrowText={entry.arrowText ?? "Ontdek"}
          icon={<NavGlyph name={DEFAULT_NAV_GLYPH} />}
          // Same `editorialCards.image` field the article-slot query already
          // reads (#2965 code review) — absent stays the flat tile, same
          // contract as the hardcoded NAV_CARDS.
          imageUrl={entry.imageUrl ?? undefined}
        />,
      );
    } else {
      // Exhaustiveness guard — fails loudly if `cardType` gains a value the
      // render doesn't handle (schema drift).
      assertNever(entry.cardType);
    }
  }

  return items;
}

function buildItemsFromHardcoded(articles: ArticleVM[]): React.ReactNode[] {
  const [article0, article1, article2] = articles;

  // No articles: the hub collapses to the pinned nav cards only.
  if (!article0) return NAV_CARDS.map(renderNavCard);

  // Fixed template: articles bubble into slots 1 · 3 · 5; nav cards pinned.
  const items: React.ReactNode[] = [
    renderArticleCard(article0),
    renderNavCard(NAV_CARDS[0]),
  ];

  if (article1) items.push(renderArticleCard(article1));
  items.push(renderNavCard(NAV_CARDS[1]));

  if (article2) items.push(renderArticleCard(article2));
  items.push(renderNavCard(NAV_CARDS[2]));

  for (let i = 3; i < NAV_CARDS.length; i++) {
    items.push(renderNavCard(NAV_CARDS[i]));
  }

  return items;
}

interface JeugdEditorialGridProps {
  articles: ArticleVM[];
  editorialConfig?: EditorialCardConfig[] | null;
}

/**
 * The `/jeugd` nav hub (Phase 7 / 7j3): a uniform grid of 16:9 image-top
 * `<EditorialHubCard>`s — `news` slots bubble the latest Jeugd articles, six
 * `nav` cards stay pinned. `editorialCards.position` no longer drives size (all
 * cards are equal 16:9); card order = source order. `cardType` selects
 * variant + bubbling.
 *
 * Content comes from the Sanity `editorialCards` singleton when set; otherwise
 * (null or empty) the hardcoded `NAV_CARDS` fallback ships (repointed targets,
 * design-summary §4). With no articles, the hub collapses to the pinned nav
 * cards.
 */
export function JeugdEditorialGrid({
  articles,
  editorialConfig,
}: JeugdEditorialGridProps) {
  const items =
    editorialConfig != null && editorialConfig.length > 0
      ? buildItemsFromConfig(editorialConfig, articles)
      : buildItemsFromHardcoded(articles);

  return (
    <div>
      <SectionKicker className="mb-8">Ontdek onze jeugd</SectionKicker>
      <TapedCardGrid columns={3} gap="sm">
        {items}
      </TapedCardGrid>
    </div>
  );
}

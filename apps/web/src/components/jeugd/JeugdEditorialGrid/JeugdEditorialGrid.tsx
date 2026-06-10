import { EditorialHubCard } from "@/components/editorial/EditorialHubCard/EditorialHubCard";
import {
  NavGlyph,
  type NavGlyphName,
} from "@/components/editorial/NavGlyph/NavGlyph";
import { SectionKicker } from "@/components/design-system";
import type { ArticleVM } from "@/lib/repositories/article.repository";
import type { EditorialCardConfig } from "@/lib/repositories/jeugd-landing-page.repository";

interface NavCardConfig {
  tag: string;
  title: string;
  arrowText: string;
  href: string;
  iconName: NavGlyphName;
}

/**
 * The six pinned nav cards (7j0b targets). Hrefs are repointed away from the
 * old dead routes: `word lid`/`inschrijven` and `medisch` default to `/hulp`
 * (membership form is #1473), `jeugdvisie` to the `#visie` anchor on this page.
 * Each carries its own Phosphor-fill glyph for the nav-variant panel.
 */
const NAV_CARDS: NavCardConfig[] = [
  {
    tag: "Aansluiten",
    title: "Word lid van KCVV",
    arrowText: "Schrijf je in",
    href: "/hulp",
    iconName: "UsersThree",
  },
  {
    tag: "Visie",
    title: "Onze jeugdvisie",
    arrowText: "Ontdek",
    href: "/jeugd#visie",
    iconName: "Eye",
  },
  {
    tag: "Praktisch",
    title: "Trainingen & ProSoccerData",
    arrowText: "Meer info",
    href: "/nieuws/prosoccerdata",
    iconName: "SoccerBall",
  },
  {
    tag: "Structuur",
    title: "Organigram",
    arrowText: "Bekijk",
    href: "/club/organigram",
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
    title: "Blessure of afmelding?",
    arrowText: "Lees meer",
    href: "/hulp",
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

type GridItem = {
  key: string;
  element: React.ReactNode;
};

function assertNever(value: never): never {
  throw new Error(`Unhandled editorialCards.cardType: ${String(value)}`);
}

function renderNavCard(nav: NavCardConfig): React.ReactNode {
  return (
    <EditorialHubCard
      variant="nav"
      href={nav.href}
      tag={nav.tag}
      title={nav.title}
      arrowText={nav.arrowText}
      icon={<NavGlyph name={nav.iconName} />}
    />
  );
}

function renderArticleCard(article: ArticleVM): React.ReactNode {
  return (
    <EditorialHubCard
      variant="news"
      href={`/nieuws/${article.slug}`}
      // News/article cards carry their own tag (7j3 data audit): the article's
      // first tag, falling back to the constant `Jeugd`. `editorialCards.tag`
      // is NOT read for article slots.
      tag={article.tags[0] ?? "Jeugd"}
      title={article.title}
      arrowText="Lees meer"
      imageUrl={article.coverImageUrl ?? undefined}
      // Decorative — the title is the link's accessible name, so an alt would
      // duplicate it.
    />
  );
}

function buildItemsFromConfig(
  config: EditorialCardConfig[],
  articles: ArticleVM[],
): GridItem[] {
  const items: GridItem[] = [];
  let articleIdx = 0;

  for (let i = 0; i < config.length; i++) {
    const entry = config[i];

    if (entry.cardType === "article") {
      // Article slots bubble: fill with the latest Jeugd articles in order.
      const article = articles[articleIdx++];
      if (!article) continue;
      items.push({
        key: `article-${article.id}`,
        element: renderArticleCard(article),
      });
    } else if (entry.cardType === "nav") {
      // Nav card — skip if required fields are missing.
      if (!entry.title || !entry.href) continue;
      items.push({
        key: `nav-sanity-${i}`,
        element: (
          <EditorialHubCard
            variant="nav"
            href={entry.href}
            // Sanity nav cards: CMS `tag` when set, else an empty pill (7j3).
            tag={entry.tag ?? ""}
            title={entry.title}
            arrowText={entry.arrowText ?? "Meer info"}
            icon={<NavGlyph name={DEFAULT_NAV_GLYPH} />}
          />
        ),
      });
    } else {
      // Exhaustiveness guard — fails loudly if `cardType` gains a value the
      // render doesn't handle (schema drift).
      assertNever(entry.cardType);
    }
  }

  return items;
}

function buildItemsFromHardcoded(articles: ArticleVM[]): GridItem[] {
  const [article0, article1, article2] = articles;

  // No articles: the hub collapses to the pinned nav cards only.
  if (!article0) {
    return NAV_CARDS.map((nav) => ({
      key: `nav-${nav.tag.toLowerCase()}`,
      element: renderNavCard(nav),
    }));
  }

  // Fixed template: articles bubble into slots 1 · 3 · 5; nav cards pinned.
  const items: GridItem[] = [
    { key: `article-${article0.id}`, element: renderArticleCard(article0) },
    { key: "nav-aansluiten", element: renderNavCard(NAV_CARDS[0]) },
  ];

  if (article1) {
    items.push({
      key: `article-${article1.id}`,
      element: renderArticleCard(article1),
    });
  }
  items.push({ key: "nav-visie", element: renderNavCard(NAV_CARDS[1]) });

  if (article2) {
    items.push({
      key: `article-${article2.id}`,
      element: renderArticleCard(article2),
    });
  }
  items.push({ key: "nav-praktisch", element: renderNavCard(NAV_CARDS[2]) });

  for (let i = 3; i < NAV_CARDS.length; i++) {
    const nav = NAV_CARDS[i];
    items.push({
      key: `nav-${nav.tag.toLowerCase()}`,
      element: renderNavCard(nav),
    });
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
 * the hardcoded `NAV_CARDS` fallback ships (repointed targets). With no
 * articles, the hub collapses to the pinned nav cards.
 */
export function JeugdEditorialGrid({
  articles,
  editorialConfig,
}: JeugdEditorialGridProps) {
  const items =
    editorialConfig != null
      ? buildItemsFromConfig(editorialConfig, articles)
      : buildItemsFromHardcoded(articles);

  return (
    <div>
      <SectionKicker className="mb-8">Ontdek onze jeugd</SectionKicker>
      <div
        data-testid="jeugd-editorial-grid"
        className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((item) => (
          <div key={item.key} className="h-full">
            {item.element}
          </div>
        ))}
      </div>
    </div>
  );
}

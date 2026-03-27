import { EditorialCard } from "@/components/club/EditorialCard/EditorialCard";
import type { ArticleVM } from "@/lib/repositories/article.repository";
import type { EditorialCardConfig } from "@/lib/repositories/jeugd-landing-page.repository";

interface NavCardConfig {
  tag: string;
  title: string;
  description?: string;
  arrowText: string;
  href: string;
  imageUrl: string;
}

const NAV_CARDS: NavCardConfig[] = [
  {
    tag: "Aansluiten",
    title: "Word lid van KCVV",
    description: "Nieuwe spelers zijn altijd welkom — van U6 tot U21.",
    arrowText: "Schrijf je in",
    href: "/club/inschrijven",
    imageUrl: "/images/jeugd/inschrijven.jpg",
  },
  {
    tag: "Visie",
    title: "Onze jeugdvisie",
    arrowText: "Ontdek",
    href: "/jeugd/visie",
    imageUrl: "/images/jeugd/visie.jpg",
  },
  {
    tag: "Praktisch",
    title: "Trainingen & ProSoccerData",
    arrowText: "Meer info",
    href: "/nieuws/prosoccerdata",
    imageUrl: "/images/jeugd/prosoccerdata.jpg",
  },
  {
    tag: "Structuur",
    title: "Organigram",
    arrowText: "Bekijk",
    href: "/club/organigram",
    imageUrl: "/images/jeugd/organigram.jpg",
  },
  {
    tag: "Hulp",
    title: "Wie contacteer ik?",
    arrowText: "Zoek het op",
    href: "/hulp",
    imageUrl: "/images/jeugd/hulp.jpg",
  },
  {
    tag: "Medisch",
    title: "Blessure of afmelding?",
    arrowText: "Lees meer",
    href: "/jeugd/medisch",
    imageUrl: "/images/jeugd/medisch.jpg",
  },
];

type GridItem = {
  key: string;
  position: string;
  element: React.ReactNode;
};

const FEATURED =
  "col-span-7 row-span-2 min-h-[520px] max-desk:col-span-full max-desk:row-span-1 max-desk:min-h-[320px] max-sm:min-h-[280px]";
const MEDIUM_1 =
  "col-start-8 col-span-5 row-start-1 min-h-[280px] max-desk:col-auto max-desk:row-auto max-desk:min-h-[260px]";
const MEDIUM_2 =
  "col-start-8 col-span-5 row-start-2 min-h-[280px] max-desk:col-auto max-desk:row-auto max-desk:min-h-[260px]";
const THIRD =
  "col-span-4 min-h-[280px] max-desk:col-auto max-desk:row-auto max-desk:min-h-[260px]";

function renderNavCard(nav: NavCardConfig): React.ReactNode {
  return (
    <EditorialCard
      href={nav.href}
      tag={nav.tag}
      title={nav.title}
      description={nav.description}
      arrowText={nav.arrowText}
      variant="nav"
      backgroundImage={nav.imageUrl}
    />
  );
}

function posClassForMedium(mediumIndex: number): string {
  return mediumIndex === 0 ? MEDIUM_1 : MEDIUM_2;
}

function posClassForPosition(
  position: EditorialCardConfig["position"],
  mediumIndex: number,
): string {
  if (position === "featured") return FEATURED;
  if (position === "medium") return posClassForMedium(mediumIndex);
  return THIRD;
}

function buildItemsFromConfig(
  config: EditorialCardConfig[],
  articles: ArticleVM[],
): GridItem[] {
  const items: GridItem[] = [];
  let articleIdx = 0;
  let mediumCount = 0;

  for (let i = 0; i < config.length; i++) {
    const entry = config[i];
    const isFeatured = entry.position === "featured";
    const isMedium = entry.position === "medium";

    if (entry.cardType === "article") {
      const article = articles[articleIdx++];
      if (!article) continue;

      const posClass = posClassForPosition(
        entry.position,
        isMedium ? mediumCount : 0,
      );
      if (isMedium) mediumCount++;

      items.push({
        key: `article-${article.id}`,
        position: posClass,
        element: (
          <EditorialCard
            href={`/nieuws/${article.slug}`}
            tag={article.tags[0] ?? "Jeugd"}
            title={article.title}
            arrowText="Lees meer"
            featured={isFeatured}
            backgroundImage={article.coverImageUrl}
          />
        ),
      });
    } else {
      // nav card — skip if required fields are missing
      if (!entry.title || !entry.href) continue;

      const posClass = posClassForPosition(
        entry.position,
        isMedium ? mediumCount : 0,
      );
      if (isMedium) mediumCount++;

      items.push({
        key: `nav-sanity-${i}`,
        position: posClass,
        element: (
          <EditorialCard
            href={entry.href}
            tag={entry.tag ?? ""}
            title={entry.title}
            description={entry.description ?? undefined}
            arrowText={entry.arrowText ?? "Meer info"}
            variant="nav"
            backgroundImage={entry.imageUrl ?? undefined}
            featured={isFeatured}
          />
        ),
      });
    }
  }

  return items;
}

function buildItemsFromHardcoded(articles: ArticleVM[]): GridItem[] {
  const [article0, article1, article2] = articles;
  const items: GridItem[] = [];

  if (article0) {
    // Full magazine layout: articles interleaved with nav cards

    // Position 1: Featured article (col 1-7, row 1-2)
    items.push({
      key: `article-${article0.id}`,
      position: FEATURED,
      element: (
        <EditorialCard
          href={`/nieuws/${article0.slug}`}
          tag={article0.tags[0] ?? "Jeugd"}
          title={article0.title}
          arrowText="Lees meer"
          featured
          backgroundImage={article0.coverImageUrl}
        />
      ),
    });

    // Position 2: Nav card — Aansluiten (col 8-12, row 1)
    items.push({
      key: "nav-aansluiten",
      position: MEDIUM_1,
      element: renderNavCard(NAV_CARDS[0]),
    });

    // Position 3: Article 2 (col 8-12, row 2)
    if (article1) {
      items.push({
        key: `article-${article1.id}`,
        position: MEDIUM_2,
        element: (
          <EditorialCard
            href={`/nieuws/${article1.slug}`}
            tag={article1.tags[0] ?? "Jeugd"}
            title={article1.title}
            arrowText="Lees meer"
            backgroundImage={article1.coverImageUrl}
          />
        ),
      });
    }

    // Position 4: Nav card — Visie (col 1-4, row 3)
    items.push({
      key: "nav-visie",
      position: THIRD,
      element: renderNavCard(NAV_CARDS[1]),
    });

    // Position 5: Article 3 (col 5-8, row 3)
    if (article2) {
      items.push({
        key: `article-${article2.id}`,
        position: THIRD,
        element: (
          <EditorialCard
            href={`/nieuws/${article2.slug}`}
            tag={article2.tags[0] ?? "Jeugd"}
            title={article2.title}
            arrowText="Lees meer"
            backgroundImage={article2.coverImageUrl}
          />
        ),
      });
    }

    // Position 6: Nav card — Praktisch (col 9-12, row 3)
    items.push({
      key: "nav-praktisch",
      position: THIRD,
      element: renderNavCard(NAV_CARDS[2]),
    });

    // Row 4: Nav cards — Structuur, Hulp, Medisch
    for (let i = 3; i < NAV_CARDS.length; i++) {
      const nav = NAV_CARDS[i];
      items.push({
        key: `nav-${nav.tag.toLowerCase()}`,
        position: THIRD,
        element: renderNavCard(nav),
      });
    }
  } else {
    // No articles: simple 3×2 grid of nav cards without absolute positioning
    for (const nav of NAV_CARDS) {
      items.push({
        key: `nav-${nav.tag.toLowerCase()}`,
        position: THIRD,
        element: renderNavCard(nav),
      });
    }
  }

  return items;
}

interface JeugdEditorialGridProps {
  articles: ArticleVM[];
  editorialConfig?: EditorialCardConfig[] | null;
}

/**
 * 9-item editorial grid: 3 dynamic article slots interleaved with 6 nav cards.
 *
 * Layout (12-col grid, 4 rows):
 *   Row 1-2: Featured article (col 1-7) | Nav card 0 (col 8-12, row 1) + Article 1 (col 8-12, row 2)
 *   Row 3:   Nav card 1 (col 1-4) | Article 2 (col 5-8) | Nav card 2 (col 9-12)
 *   Row 4:   Nav card 3 (col 1-4) | Nav card 4 (col 5-8) | Nav card 5 (col 9-12)
 *
 * When editorialConfig is provided, card content and positions come from Sanity.
 * Article slots (cardType "article") are auto-filled with the latest jeugd articles in order.
 * Falls back to hardcoded NAV_CARDS when editorialConfig is null or undefined.
 *
 * When no articles are available, the grid falls back to a simple nav card layout.
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
    <div className="max-w-inner-lg mx-auto px-4 md:px-10">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-label text-kcvv-gray mb-3">
          <span className="block w-5 h-0.5 bg-kcvv-green" />
          Ontdek onze jeugd
        </div>
        <h2 className="font-title font-extrabold text-kcvv-gray-blue text-3xl md:text-5xl">
          Alles op één plek
        </h2>
      </div>
      <div
        data-testid="jeugd-editorial-grid"
        className="grid grid-cols-12 gap-5 max-desk:grid-cols-2 max-sm:grid-cols-1"
      >
        {items.map((item) => (
          <div key={item.key} className={item.position}>
            {item.element}
          </div>
        ))}
      </div>
    </div>
  );
}

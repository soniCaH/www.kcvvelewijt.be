import { EditorialCard } from "../EditorialCard/EditorialCard";
import { HISTORY_24_25_CARD, ULTRAS_HEADER_CARD } from "@/lib/sanity/images";

interface CardData {
  href: string;
  tag: string;
  title: string;
  description?: string;
  arrowText: string;
  featured?: boolean;
  backgroundImage?: string;
}

const cards: CardData[] = [
  {
    href: "/club/geschiedenis",
    tag: "Geschiedenis",
    title: "75 jaar voetbalpassie in Elewijt",
    description:
      "Van een bescheiden begin op een modderig veld tot een bruisende club met honderden leden. Ontdek het verhaal van KCVV.",
    arrowText: "Lees meer",
    featured: true,
    backgroundImage: HISTORY_24_25_CARD,
  },
  {
    href: "/club/bestuur",
    tag: "Bestuur",
    title: "Het team achter het team",
    description: "Maak kennis met het bestuur dat de club draaiende houdt.",
    arrowText: "Ontdek",
  },
  {
    href: "/club/organigram",
    tag: "Organigram",
    title: "Onze structuur",
    description: "Van voorzitter tot jeugdcoördinator — wie doet wat?",
    arrowText: "Bekijk",
  },
  {
    href: "/club/ultras",
    tag: "Ultras",
    title: "De 12de man",
    arrowText: "Meer info",
    backgroundImage: ULTRAS_HEADER_CARD,
  },
  {
    href: "/club/angels",
    tag: "Angels",
    title: "Onze engelen",
    arrowText: "Meer info",
  },
  {
    href: "/club/aansluiten",
    tag: "Aansluiten",
    title: "Word lid",
    arrowText: "Schrijf je in",
    backgroundImage: "/images/youth-trainers.jpg",
  },
];

const gridPositions = [
  "col-span-7 row-span-2 min-h-[520px] max-desk:col-span-full max-desk:row-span-1 max-desk:min-h-[320px] max-sm:min-h-[280px]",
  "col-start-8 col-span-5 row-start-1 min-h-[280px] max-desk:col-auto max-desk:row-auto max-desk:min-h-[260px]",
  "col-start-8 col-span-5 row-start-2 min-h-[280px] max-desk:col-auto max-desk:row-auto max-desk:min-h-[260px]",
  "col-span-4 row-start-3 min-h-[280px] max-desk:col-auto max-desk:row-auto max-desk:min-h-[260px]",
  "col-span-4 row-start-3 min-h-[280px] max-desk:col-auto max-desk:row-auto max-desk:min-h-[260px]",
  "col-span-4 row-start-3 min-h-[280px] max-desk:col-auto max-desk:row-auto max-desk:min-h-[260px]",
];

export function ClubEditorialGrid() {
  return (
    <div className="max-w-inner-lg mx-auto px-4 md:px-10">
      <div className="mb-12">
        <div className="tracking-label text-kcvv-gray mb-3 flex items-center gap-2 text-xs font-extrabold uppercase">
          <span className="bg-kcvv-green block h-0.5 w-5" />
          Ontdek onze club
        </div>
        <h2 className="font-title text-kcvv-gray-blue text-3xl font-extrabold md:text-5xl">
          Meer dan een voetbalclub
        </h2>
      </div>
      <div
        data-testid="editorial-grid"
        className="max-desk:grid-cols-2 grid grid-cols-12 grid-rows-[auto_auto_auto] gap-5 max-sm:grid-cols-1"
      >
        {cards.map((card, index) => (
          <div key={card.href} className={gridPositions[index]}>
            <EditorialCard
              href={card.href}
              tag={card.tag}
              title={card.title}
              description={card.description}
              arrowText={card.arrowText}
              featured={card.featured}
              backgroundImage={card.backgroundImage}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

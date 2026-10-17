// PROTOTYPE (#3519) — throwaway, lives only on branch prototype/3519-share-blocks.
// Which blocks move in each look × template; ?variant=1|2|3 = how fine the blocks are.
import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity/client";
import { BlocksPrototype } from "@/components/share/prototype-blocks/BlocksPrototype";
import type { LookItem } from "@/components/share/prototype-looks/LooksPrototype";

const TYPES = [
  "interview",
  "announcement",
  "transfer",
  "event",
  "matchPreview",
  "matchRecap",
];
const ART = `{ "title": coalesce(pt::text(title), title, ""), articleType, publishedAt,
  "spans": title[0].children[]{ "text": coalesce(text, ""), "accent": "accent" in coalesce(marks, []) },
  "img": coverImage.asset->url, "hx": coalesce(coverImage.hotspot.x, 0.5), "hy": coalesce(coverImage.hotspot.y, 0.5),
  "fact": body[_type == "eventFact"][0]{ date, startTime, location } }`;
const QUERY = `{
  "articles": [${TYPES.map((t) => `*[_type == "article" && articleType == "${t}" && defined(coverImage)] | order(publishedAt desc)[0]${ART}`).join(",")}],
  "event": *[_type == "event" && defined(coverImage)] | order(dateStart desc)[0]{ title, eventType, dateStart, location,
    "img": coverImage.asset->url, "hx": coalesce(coverImage.hotspot.x, 0.5), "hy": coalesce(coverImage.hotspot.y, 0.5) },
  "player": *[_type == "team" && age == "A" && !archived][0].players[@->psdImage != null][0]->{ firstName, lastName, "img": coalesce(celebrationImage, psdImage).asset->url }
}`;

type Art = {
  title: string;
  articleType: string;
  publishedAt?: string;
  spans?: { text: string; accent: boolean }[];
  img?: string;
  hx: number;
  hy: number;
  fact?: { date?: string; startTime?: string; location?: string };
} | null;
type Evt = {
  title: string;
  eventType?: string;
  dateStart?: string;
  location?: string;
  img?: string;
  hx: number;
  hy: number;
} | null;
type Ply = { firstName: string; lastName: string; img?: string } | null;

export default async function ShareBlocksPrototypeRoute({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { variant } = await searchParams;
  // Real club photos live on production. Read-only.
  const prod = sanityClient.withConfig({ dataset: "production" });
  if (prod.config().dataset !== "production") throw new Error("not prod");
  const raw = await prod.fetch<{ articles: Art[]; event: Evt; player: Ply }>(
    QUERY,
  );

  const articles: LookItem[] = raw.articles
    .filter((r): r is NonNullable<Art> => Boolean(r))
    .map((r) => ({
      key: r.articleType,
      kind: "article",
      articleType: r.articleType,
      title: r.title,
      spans: r.spans?.length ? r.spans : [{ text: r.title, accent: false }],
      date: r.fact?.date ?? r.publishedAt ?? null,
      time: r.fact?.startTime ?? null,
      location: r.fact?.location ?? null,
      img: r.img ?? null,
      hx: r.hx,
      hy: r.hy,
    }));
  const e = raw.event;
  const event: LookItem | null = e && {
    key: "event",
    kind: "event",
    eventType: e.eventType ?? "Andere",
    title: e.title,
    spans: [{ text: e.title, accent: false }],
    date: e.dateStart ?? null,
    time: e.dateStart ?? null,
    location: e.location ?? null,
    img: e.img ?? null,
    hx: e.hx,
    hy: e.hy,
  };
  const p = raw.player;
  // Raw Sanity URL: the looks wrap it in /_next/image themselves.
  const player = {
    name: p ? `${p.firstName} ${p.lastName}` : "Speler",
    img: p?.img ?? null,
  };

  return (
    <BlocksPrototype
      variant={variant ?? "1"}
      articles={articles}
      event={event}
      player={player}
    />
  );
}

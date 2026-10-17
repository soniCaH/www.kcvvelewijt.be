// PROTOTYPE (#3524) — throwaway, lives only on branch prototype/3524-share-controls.
// How the /share controls sit on an iPhone; ?variant=1|2|3 = three layouts.
import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity/client";
import { ControlsPrototype } from "@/components/share/prototype-controls/ControlsPrototype";
import type { LookItem } from "@/components/share/prototype-looks/LooksPrototype";

// As decided in #3507: the 20 newest articles, upcoming + last-7-days events
// (widened to the 8 newest here, so the list is never empty on a quiet week).
const QUERY = `{
  "articles": *[_type == "article" && defined(articleType)] | order(publishedAt desc)[0...20]{
    _id, "title": coalesce(pt::text(title), title, ""), articleType, publishedAt,
    "spans": title[0].children[]{ "text": coalesce(text, ""), "accent": "accent" in coalesce(marks, []) },
    "img": coverImage.asset->url, "hx": coalesce(coverImage.hotspot.x, 0.5), "hy": coalesce(coverImage.hotspot.y, 0.5),
    "fact": body[_type == "eventFact"][0]{ date, startTime, location } },
  "events": *[_type == "event"] | order(dateStart desc)[0...8]{ _id, title, eventType, dateStart, location,
    "img": coverImage.asset->url, "hx": coalesce(coverImage.hotspot.x, 0.5), "hy": coalesce(coverImage.hotspot.y, 0.5) },
  "player": *[_type == "team" && age == "A" && !archived][0].players[@->psdImage != null][0]->{ firstName, lastName, "img": coalesce(celebrationImage, psdImage).asset->url }
}`;

type Raw = {
  articles: {
    _id: string;
    title: string;
    articleType: string;
    publishedAt?: string;
    spans?: { text: string; accent: boolean }[];
    img?: string;
    hx: number;
    hy: number;
    fact?: { date?: string; startTime?: string; location?: string };
  }[];
  events: {
    _id: string;
    title: string;
    eventType?: string;
    dateStart?: string;
    location?: string;
    img?: string;
    hx: number;
    hy: number;
  }[];
  player: { firstName: string; lastName: string; img?: string } | null;
};

export default async function ShareControlsPrototypeRoute({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { variant } = await searchParams;
  // Real club photos live on production. Read-only.
  const prod = sanityClient.withConfig({ dataset: "production" });
  if (prod.config().dataset !== "production") throw new Error("not prod");
  const raw = await prod.fetch<Raw>(QUERY);

  const articles: LookItem[] = raw.articles.map((r) => ({
    key: r._id,
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
  const events: LookItem[] = raw.events.map((e) => ({
    key: e._id,
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
  }));
  const p = raw.player;
  const player = {
    name: p ? `${p.firstName} ${p.lastName}` : "Speler",
    img: p?.img ?? null,
  };

  return (
    <ControlsPrototype
      variant={variant ?? "1"}
      articles={articles}
      events={events}
      player={player}
    />
  );
}

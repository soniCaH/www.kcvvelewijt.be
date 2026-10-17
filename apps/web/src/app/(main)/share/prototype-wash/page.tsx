// PROTOTYPE (#3522) — throwaway, lives only on branch prototype/3522-share-wash.
// Tunes the Zacht / Normaal / Sterk wash per theme on real club photos;
// ?variant=1|2|3 = what "stronger" means (more cover, higher, or both).
import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity/client";
import {
  WashPrototype,
  type WashPhoto,
} from "@/components/share/prototype-wash/WashPrototype";
import type { LookItem } from "@/components/share/prototype-looks/LooksPrototype";

// Real covers picked by eye from the newest 80 on production (2026-10-17).
const PHOTOS: { id: string; label: string }[] = [
  {
    id: "article-drupal-d457dfb1-00d2-4ad8-a65f-35b8d46898d3",
    label: "Felle lucht",
  },
  {
    id: "article-drupal-9656047f-4dd2-490f-91fb-3d0380ec6689",
    label: "Druk, veel volk",
  },
  {
    id: "article-drupal-865d380e-e7c0-4471-88a6-b1a676966cb1",
    label: "Avondmatch, lichten",
  },
  {
    id: "article-drupal-d29302fb-7f3c-4d25-a3c5-11946595c9dd",
    label: "Donker portret",
  },
  {
    id: "event-drupal-c8c38a5e-c6ae-4fa6-b661-8338dde82609",
    label: "Affiche met tekst",
  },
];

const QUERY = `{
  "photos": *[_id in $ids]{ _id, "img": coverImage.asset->url,
    "hx": coalesce(coverImage.hotspot.x, 0.5), "hy": coalesce(coverImage.hotspot.y, 0.5) },
  "article": *[_type == "article" && articleType == "interview" && defined(coverImage)
    && count(title[0].children[defined(marks) && "accent" in marks]) > 0] | order(publishedAt desc)[0]{
    "title": coalesce(pt::text(title), title, ""), publishedAt,
    "spans": title[0].children[]{ "text": coalesce(text, ""), "accent": "accent" in coalesce(marks, []) } },
  "event": *[_type == "event" && defined(location)] | order(dateStart desc)[0]{ title, eventType, dateStart, location }
}`;

type Raw = {
  photos: { _id: string; img?: string; hx: number; hy: number }[];
  article: {
    title: string;
    publishedAt?: string;
    spans?: { text: string; accent: boolean }[];
  } | null;
  event: {
    title: string;
    eventType?: string;
    dateStart?: string;
    location?: string;
  } | null;
};

export default async function ShareWashPrototypeRoute({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { variant } = await searchParams;
  // Real club photos live on production. Read-only.
  const prod = sanityClient.withConfig({ dataset: "production" });
  if (prod.config().dataset !== "production") throw new Error("not prod");
  const raw = await prod.fetch<Raw>(QUERY, { ids: PHOTOS.map((p) => p.id) });

  const photos: WashPhoto[] = PHOTOS.map((p) => {
    const r = raw.photos.find((x) => x._id === p.id);
    return {
      label: p.label,
      img: r?.img ?? null,
      hx: r?.hx ?? 0.5,
      hy: r?.hy ?? 0.5,
    };
  });

  const a = raw.article;
  const article: LookItem = {
    key: "interview",
    kind: "article",
    articleType: "interview",
    title: a?.title ?? "Interview",
    spans: a?.spans?.length
      ? a.spans
      : [{ text: a?.title ?? "Interview", accent: false }],
    date: a?.publishedAt ?? null,
    time: null,
    location: null,
    img: null,
    hx: 0.5,
    hy: 0.5,
  };
  const e = raw.event;
  const event: LookItem = {
    key: "event",
    kind: "event",
    eventType: e?.eventType ?? "Andere",
    title: e?.title ?? "Evenement",
    spans: [{ text: e?.title ?? "Evenement", accent: false }],
    date: e?.dateStart ?? null,
    time: e?.dateStart ?? null,
    location: e?.location ?? null,
    img: null,
    hx: 0.5,
    hy: 0.5,
  };

  return (
    <WashPrototype
      variant={variant ?? "1"}
      photos={photos}
      article={article}
      event={event}
    />
  );
}

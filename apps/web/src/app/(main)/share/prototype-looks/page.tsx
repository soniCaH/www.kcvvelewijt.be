// PROTOTYPE (#3509) — throwaway, lives only on branch prototype/3509-share-looks.
// Five story looks for news and events, switchable via ?variant=A..E, on real
// Sanity articles (one per articleType) and real events (with and without cover).
import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity/client";
import {
  LooksPrototype,
  type LookItem,
} from "@/components/share/prototype-looks/LooksPrototype";

const TYPES = [
  "interview",
  "announcement",
  "transfer",
  "event",
  "matchPreview",
  "matchRecap",
] as const;

const ART = `{ "title": coalesce(pt::text(title), title, ""), articleType, publishedAt,
  "spans": title[0].children[]{ "text": coalesce(text, ""), "accent": "accent" in coalesce(marks, []) },
  "img": coverImage.asset->url, "hx": coalesce(coverImage.hotspot.x, 0.5), "hy": coalesce(coverImage.hotspot.y, 0.5),
  "fact": body[_type == "eventFact"][0]{ date, startTime, location } }`;
const EVT = `{ title, eventType, dateStart, location,
  "img": coverImage.asset->url, "hx": coalesce(coverImage.hotspot.x, 0.5), "hy": coalesce(coverImage.hotspot.y, 0.5) }`;

const QUERY = `{
  ${TYPES.map((t) => `"${t}": *[_type == "article" && articleType == "${t}" && defined(coverImage)] | order(publishedAt desc)[0]${ART}`).join(",\n")},
  ${TYPES.map((t) => `"${t}Any": *[_type == "article" && articleType == "${t}"] | order(publishedAt desc)[0]${ART}`).join(",\n")},
  "eventCover": *[_type == "event" && defined(coverImage)] | order(dateStart desc)[0]${EVT},
  "eventBare": *[_type == "event" && !defined(coverImage)] | order(dateStart desc)[0]${EVT}
}`;

type Raw = {
  title: string;
  spans?: { text: string; accent: boolean }[];
  articleType?: string;
  eventType?: string;
  publishedAt?: string;
  dateStart?: string;
  location?: string;
  img?: string;
  hx: number;
  hy: number;
  fact?: { date?: string; startTime?: string; location?: string };
} | null;

export default async function ShareLooksPrototypeRoute({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string; drafts?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { variant, drafts } = await searchParams;
  // Real club photos live on production; staging holds seed images. Read-only.
  const prod = sanityClient.withConfig({ dataset: "production" });
  if (prod.config().dataset !== "production") throw new Error("not prod");
  const raw = await prod.fetch<Record<string, Raw>>(QUERY);
  // Production has no matchPreview/matchRecap articles yet: borrow staging seeds.
  const stg = await sanityClient
    .withConfig({ dataset: "staging" })
    .fetch<Record<string, Raw>>(QUERY);

  const items: LookItem[] = [];
  for (const t of TYPES) {
    const r = raw[t] ?? raw[`${t}Any`] ?? stg[t];
    if (!r) continue;
    items.push({
      key: t,
      kind: "article",
      articleType: t,
      title: r.title,
      spans: r.spans?.length ? r.spans : [{ text: r.title, accent: false }],
      date: r.fact?.date ?? r.publishedAt ?? null,
      time: r.fact?.startTime ?? null,
      location: r.fact?.location ?? null,
      img: r.img ?? null,
      hx: r.hx,
      hy: r.hy,
    });
  }
  for (const k of ["eventCover", "eventBare"] as const) {
    // Production has no event without a cover yet: show the newest one bare.
    const r =
      k === "eventBare"
        ? (raw.eventBare ??
          (raw.eventCover && { ...raw.eventCover, img: undefined }))
        : raw[k];
    if (!r) continue;
    items.push({
      key: k,
      kind: "event",
      eventType: r.eventType ?? "Andere",
      title: r.title,
      spans: [{ text: r.title, accent: false }],
      date: r.dateStart ?? null,
      time: r.dateStart ?? null,
      location: r.location ?? null,
      img: r.img ?? null,
      hx: r.hx,
      hy: r.hy,
    });
  }

  // #3518 round 1: `?drafts=1` shows the look's 8 AI fallback drafts on the bare event.
  const bare = items.find((i) => i.key === "eventBare");
  const v = variant ?? "A";
  const shown =
    drafts && bare
      ? Array.from({ length: 8 }, (_, n) => ({
          ...bare,
          key: `draft-${n + 1}`,
          img: null,
          draft: n + 1,
          fallback: `/images/share-fallback-drafts/${v}-${n + 1}.jpg`,
        }))
      : items;

  return <LooksPrototype variant={v} items={shown} />;
}

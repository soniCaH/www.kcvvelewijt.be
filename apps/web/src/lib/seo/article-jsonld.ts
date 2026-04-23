import type { PortableTextBlock } from "@portabletext/react";
import { SITE_CONFIG } from "@/lib/constants";
import type { EventJsonLdInput, PersonAboutInput } from "./jsonld";

interface ArticleSubjectPlayerRef {
  firstName?: string | null;
  lastName?: string | null;
  psdId?: string | null;
  position?: string | null;
  transparentImageUrl?: string | null;
  psdImageUrl?: string | null;
}

interface ArticleSubjectStaffRef {
  firstName?: string | null;
  lastName?: string | null;
  functionTitle?: string | null;
  photoUrl?: string | null;
}

interface ArticleSubjectLike {
  kind?: "player" | "staff" | "custom" | null;
  playerRef?: ArticleSubjectPlayerRef | null;
  staffRef?: ArticleSubjectStaffRef | null;
  customName?: string | null;
  customRole?: string | null;
  customPhotoUrl?: string | null;
}

export interface ArticleForSeo {
  title: string;
  articleType?: string | null;
  subject?: ArticleSubjectLike | null;
  body?: unknown;
  coverImageUrl?: string | null;
}

/**
 * Interview branch (design §12): derive the `about: Person` input for the
 * NewsArticle JSON-LD from the article's subject. schema.org has no
 * canonical Interview type — NewsArticle + about:Person is the fallback
 * Google's Rich Results Test accepts.
 *
 * Player subjects resolve with a profile URL (/spelers/{psdId}). Staff
 * and custom subjects resolve without a URL — the article projection
 * doesn't carry staff psdId today, and custom subjects have no canonical
 * profile page. Unknown kinds return undefined rather than falling
 * through to the last branch.
 */
export function buildAboutFromSubject(
  article: ArticleForSeo,
): PersonAboutInput | undefined {
  if (article.articleType !== "interview") return undefined;
  const subject = article.subject;
  if (!subject?.kind) return undefined;
  if (subject.kind === "player") {
    const p = subject.playerRef;
    if (!p) return undefined;
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
    if (!name) return undefined;
    return {
      name,
      url: p.psdId ? `${SITE_CONFIG.siteUrl}/spelers/${p.psdId}` : undefined,
      image: p.transparentImageUrl ?? p.psdImageUrl ?? undefined,
      jobTitle: p.position ?? undefined,
    };
  }
  if (subject.kind === "staff") {
    const s = subject.staffRef;
    if (!s) return undefined;
    const name = [s.firstName, s.lastName].filter(Boolean).join(" ").trim();
    if (!name) return undefined;
    return {
      name,
      image: s.photoUrl ?? undefined,
      jobTitle: s.functionTitle ?? undefined,
    };
  }
  if (subject.kind === "custom") {
    const name = subject.customName?.trim() ?? "";
    if (!name) return undefined;
    return {
      name,
      image: subject.customPhotoUrl ?? undefined,
      jobTitle: subject.customRole ?? undefined,
    };
  }
  return undefined;
}

/**
 * Combine a date string with an optional time into a local-floating ISO.
 * Europe/Brussels is +01:00 in winter, +02:00 in summer — we don't know
 * which applies at render time, so we emit without a TZ suffix and let
 * Google render in the viewer's locale.
 */
function withTime(date: string, time?: string | null): string {
  const cleanTime = typeof time === "string" ? time.trim() : "";
  if (!cleanTime) return date;
  return `${date}T${cleanTime}:00`;
}

type EventFactBlock = PortableTextBlock & {
  _type: "eventFact";
  title?: string;
  date?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  address?: string;
};

const isEventFactBlock = (
  b: PortableTextBlock & { _type?: string },
): b is EventFactBlock => b._type === "eventFact";

/**
 * Event branch (design §12): pull the first `eventFact` block out of the
 * body and map it to schema.org Event. Distinct from SportsEvent which
 * models matches.
 *
 * startDate combines date + startTime when the editor set a time; endDate
 * is only emitted when the editor explicitly set endDate or endTime —
 * synthesising a bare-date endDate alongside a timed startDate makes
 * Google render events as "ends before it starts".
 */
export function buildEventJsonLdInput(
  article: ArticleForSeo,
  shareUrl: string,
): EventJsonLdInput | undefined {
  if (article.articleType !== "event") return undefined;
  const body = article.body as Array<
    PortableTextBlock & { _type?: string }
  > | null;
  if (!Array.isArray(body)) return undefined;
  const ev = body.find(isEventFactBlock);
  if (!ev) return undefined;
  if (!ev.date) return undefined;
  const name = ev.title?.trim() || article.title;
  const endDate =
    ev.endDate || ev.endTime
      ? withTime(ev.endDate ?? ev.date, ev.endTime)
      : undefined;
  return {
    name,
    startDate: withTime(ev.date, ev.startTime),
    endDate,
    location: ev.location,
    address: ev.address,
    url: shareUrl,
    image: article.coverImageUrl ?? undefined,
  };
}

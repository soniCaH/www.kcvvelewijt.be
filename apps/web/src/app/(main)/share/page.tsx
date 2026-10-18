import type { Metadata } from "next";

// Always server-render: match data changes throughout the day
export const dynamic = "force-dynamic";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { PlayerRepository } from "@/lib/repositories/player.repository";
import {
  ArticleRepository,
  type ShareArticleRow,
} from "@/lib/repositories/article.repository";
import {
  EventRepository,
  type ShareEventRow,
} from "@/lib/repositories/event.repository";
import { degradeSection } from "@/lib/effect/degrade";
import type { Match } from "@/lib/effect/schemas/match.schema";
import { toDisplayZone, toMatchDisplayZone } from "@/lib/utils/dates";
import { capitalize } from "@/lib/utils/capitalize";
import { SharePage } from "@/components/share/SharePage/SharePage";
import type {
  MatchOption,
  PlayerForShare,
} from "@/components/share/SharePage/SharePage";
import {
  shareCover,
  type ShareItem,
} from "@/components/share/looks/share-content";
import { DEFAULT_EVENT_TYPE } from "@/components/event/event-type-style";

export const metadata: Metadata = {
  title: "Story Generator",
  robots: { index: false, follow: false },
};

/** `Zaterdag · 15:00` — one consumer, so the shape stays local (#2430 rule 2). */
function formatDateTime(match: Match): string | undefined {
  const weekday = capitalize(toMatchDisplayZone(match.date).toFormat("cccc"));
  return match.time ? `${weekday} · ${match.time}` : weekday;
}

function toMatchOption(match: Match): MatchOption {
  const home = match.home_team.name;
  const away = match.away_team.name;
  const teamLabel = match.kcvv_team_label ? ` (${match.kcvv_team_label})` : "";
  return {
    id: match.id,
    label: `${home} - ${away}${teamLabel}`,
    matchName: `${home} — ${away}`,
    competition: match.competition,
    dateTime: formatDateTime(match),
    homeLogo: match.home_team.logo,
    awayLogo: match.away_team.logo,
    kcvvTeamLabel: match.kcvv_team_label,
  };
}

/** `zaterdag 18 oktober` + the date block's `18` / `okt`, in the club's zone. */
function dateParts(iso: string | null | undefined) {
  const dt = iso ? toDisplayZone(iso) : null;
  if (!dt?.isValid) return { dt: null, date: "", day: "", month: "" };
  return {
    dt,
    date: dt.toFormat("cccc d MMMM"),
    day: dt.toFormat("d"),
    month: dt.toFormat("MMM").replace(".", ""),
  };
}

function toArticleItem(row: ShareArticleRow): ShareItem {
  // An event article is dated by its event, every other one by publication.
  const fact = row.eventFact;
  const { dt: _dt, ...date } = dateParts(fact?.date ?? row.publishedAt);
  return {
    kind: "article",
    slug: row.slug,
    type: row.articleType ?? "announcement",
    title: row.title,
    spans: (row.spans ?? []).filter((s) => s.text),
    ...date,
    time: fact?.startTime ?? "",
    location: fact?.location ?? "",
    cover: shareCover(row),
  };
}

function toEventItem(row: ShareEventRow): ShareItem {
  const { dt, ...date } = dateParts(row.dateStart);
  const hour = dt?.toFormat("HH:mm");
  return {
    kind: "event",
    slug: row.slug,
    type: row.eventType ?? DEFAULT_EVENT_TYPE,
    title: row.title,
    spans: [],
    ...date,
    // The event schema has no all-day flag: a local-midnight start is read
    // as all-day (no hour on the story), the same rule `<TicketStub>` uses.
    time: hour && hour !== "00:00" ? hour : "",
    location: row.location ?? "",
    cover: shareCover(row),
  };
}

const firstParam = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

/**
 * Section reads (#3540): the news and event pickers degrade to empty on a
 * failed Sanity read, so a broken read never blocks a match share. The
 * deep-linked slug rides along in the same read; unknown = `null`.
 */
async function fetchShareItems(
  articleSlug: string | undefined,
  eventSlug: string | undefined,
): Promise<{
  articles: ShareItem[];
  events: ShareItem[];
  pickedArticle: ShareItem | null;
  pickedEvent: ShareItem | null;
}> {
  return runPromise(
    Effect.gen(function* () {
      const articleRepo = yield* ArticleRepository;
      const eventRepo = yield* EventRepository;
      const empty = { list: [], picked: null };
      const [articles, events] = yield* Effect.all(
        [
          degradeSection(
            articleRepo.findForShare(articleSlug),
            empty,
            "[share] article picker read failed",
          ),
          degradeSection(
            eventRepo.findForShare(eventSlug),
            empty,
            "[share] event picker read failed",
          ),
        ],
        { concurrency: 2 },
      );
      return {
        articles: articles.list.map(toArticleItem),
        events: events.list.map(toEventItem),
        pickedArticle: articles.picked ? toArticleItem(articles.picked) : null,
        pickedEvent: events.picked ? toEventItem(events.picked) : null,
      };
    }),
  );
}

// Subject read: both pickers are this internal tool's entire content, so a
// failed read (Sanity players or the BFF match window) takes the page down
// with it — this route is `force-dynamic`, so there is no ISR fallback to
// protect either way (#2864).
async function fetchSharePageData(): Promise<{
  matches: MatchOption[];
  players: PlayerForShare[];
}> {
  return runPromise(
    Effect.gen(function* () {
      const bff = yield* BffService;
      const playerRepo = yield* PlayerRepository;

      const [windowMatches, allPlayers] = yield* Effect.all(
        [
          // Matchday-aware window: includes matches that already kicked off /
          // finished today (for goal/HT/FT/card posts) plus the next 7 days
          // (for pre-game posts). Replaces the old getNextMatches + today-only
          // filter, which dropped a match the moment it started (#2160).
          // Deliberately narrow (#2782), not converged onto
          // `degradeIfPermanent`'s three-tag split. Widening to also catch
          // `ParseError`/`HttpApiDecodeError` would degrade a genuine
          // contract-decode failure to the same empty picker as "no
          // upcoming matches" — this internal tool would silently render
          // with nothing to post about instead of surfacing the failure.
          // This route is `force-dynamic` (top of file), so there is no ISR
          // cache to fall back to anyway: a thrown transient failure already
          // hits the error boundary on every request until it clears, the
          // same outcome staying narrow leaves unchanged.
          bff
            .getMatchesWindow()
            .pipe(Effect.catchTag("HttpNotFound", () => Effect.succeed([]))),
          playerRepo.findAll(),
        ],
        { concurrency: 2 },
      );

      const matches = windowMatches.map(toMatchOption);

      const players: PlayerForShare[] = allPlayers.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        number: p.number,
        celebrationImageUrl: p.celebrationImageUrl,
        psdImageUrl: p.imageUrl,
      }));

      return { matches, players };
    }).pipe(Effect.orDie),
  );
}

export default async function ShareRoute({
  searchParams,
}: {
  searchParams: Promise<{
    article?: string | string[];
    event?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const articleSlug = firstParam(params.article);
  const eventSlug = firstParam(params.event);
  const [{ matches, players }, share] = await Promise.all([
    fetchSharePageData(),
    fetchShareItems(articleSlug, eventSlug),
  ]);
  const initial = articleSlug
    ? { kind: "article" as const, item: share.pickedArticle }
    : eventSlug
      ? { kind: "event" as const, item: share.pickedEvent }
      : undefined;
  return (
    // A new key per deep link: client navigation between two links starts
    // the tool afresh instead of keeping the first link's state.
    <SharePage
      key={
        articleSlug
          ? `a:${articleSlug}`
          : eventSlug
            ? `e:${eventSlug}`
            : "share"
      }
      matches={matches}
      players={players}
      articles={share.articles}
      events={share.events}
      initial={initial}
    />
  );
}

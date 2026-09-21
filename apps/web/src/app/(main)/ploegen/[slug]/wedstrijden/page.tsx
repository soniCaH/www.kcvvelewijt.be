import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { toMatchDisplayZone } from "@/lib/utils/dates";
import { runPromise } from "@/lib/effect/runtime";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { BffService } from "@/lib/effect/services/BffService";
import type { Match } from "@kcvv/api-contract";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { TeamAgendaRow } from "@/components/team/TeamMatchesSection/TeamAgendaRow";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PageContainer } from "@/components/design-system/PageContainer";
import { pendingEmptyBody } from "@/lib/utils/empty-state-copy";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildSportsTeamJsonLd } from "@/lib/seo/jsonld";
import { transformMatchToSchedule } from "@/components/match";
import type { ScheduleRow } from "@/components/match/types";
import { findNextMatch } from "@/components/team/TeamMatchesSection/match-visibility";
import { AgendaScrollToNext } from "./AgendaScrollToNext";

interface WedstrijdenPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: WedstrijdenPageProps): Promise<Metadata> {
  const { slug } = await params;
  // Subject read: this route's metadata is entirely about this one team, so
  // a failed read takes it down with it — `null` (genuinely no such team) is
  // the only case that degrades to the "niet gevonden" fallback (#2864).
  const team = await runPromise(
    Effect.gen(function* () {
      const repo = yield* TeamRepository;
      return yield* repo.findBySlug(slug);
    }).pipe(Effect.orDie),
  );
  if (!team)
    return {
      title: "Team niet gevonden",
      // #2963: this branch renders under a 200 (a `loading.tsx`
      // Suspense boundary flushes the shell before `notFound()` runs),
      // so noindex is what actually keeps it out of the index.
      robots: { index: false, follow: false },
    };

  const displayName = team.displayName;
  const title = `Wedstrijden — ${displayName}`;
  const description = `Volledig wedstrijdschema van ${displayName}.`;
  const url = `${SITE_CONFIG.siteUrl}/ploegen/${slug}/wedstrijden`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: team.teamImageUrl
        ? [{ url: team.teamImageUrl, alt: `${displayName} teamfoto` }]
        : [DEFAULT_OG_IMAGE],
    },
  };
}

interface MonthGroup {
  label: string;
  monthName: string;
  yearSuffix: string;
  matches: ScheduleRow[];
}

function groupByMonth(matches: ScheduleRow[]): MonthGroup[] {
  const sorted = [...matches].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const grouped = new Map<string, MonthGroup>();

  for (const m of sorted) {
    const dt = toMatchDisplayZone(m.date);
    const key = dt.toFormat("yyyy-MM");
    if (!grouped.has(key)) {
      const monthName =
        dt.toFormat("LLLL").charAt(0).toUpperCase() +
        dt.toFormat("LLLL").slice(1);
      const yearSuffix = `'${dt.toFormat("yy")}`;
      grouped.set(key, {
        label: `${monthName} ${yearSuffix}.`,
        monthName,
        yearSuffix,
        matches: [],
      });
    }
    grouped.get(key)!.matches.push(m);
  }

  return Array.from(grouped.values());
}

export default async function WedstrijdenPage({
  params,
}: WedstrijdenPageProps) {
  const { slug } = await params;

  // Subject read: the team is this page's entire content, so a failed read
  // takes it down with it — `null` (genuinely no such team) is the only case
  // that resolves to `notFound()` (#2864).
  const team = await runPromise(
    Effect.gen(function* () {
      const repo = yield* TeamRepository;
      return yield* repo.findBySlug(slug);
    }).pipe(Effect.orDie),
  );

  if (!team) notFound();

  const displayName = team.displayName;
  const psdTeamId = team.psdId ? parseInt(team.psdId, 10) : NaN;
  const pageUrl = `${SITE_CONFIG.siteUrl}/ploegen/${slug}/wedstrijden`;

  let rawMatches: readonly Match[] = [];
  if (Number.isFinite(psdTeamId) && psdTeamId > 0) {
    rawMatches = await runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        // No `catchTag` at all (#3041), and none of `degradeIfPermanent`'s
        // three-tag split either: `team` above already resolved from Sanity,
        // so every permanent tag on THIS read — `ParseError`,
        // `HttpApiDecodeError` and `HttpNotFound` alike — means only the
        // matches read failed, not the team. Calling `notFound()` for any of
        // them renders "Pagina niet gevonden" for a team whose lookup just
        // succeeded, and under that team's own indexable metadata, since
        // `generateMetadata` resolves the same subject separately.
        //
        // `HttpNotFound` used to be the one exception. It could not mean what
        // `classify-bff-failure.ts` documents it to mean here — a stale
        // `psdId` in Sanity — because `getMatches` is a LIST read: PSD answers
        // an unknown team id with `200 []`, which decodes cleanly, and only
        // `/games/{id}/info` opts into `emptyBodyIsNotFound`. The one thing
        // left that can produce the tag is PSD 404-ing the endpoint itself,
        // i.e. an outage. Degrading that to `[]` would print "Nog geen
        // wedstrijden gepland" for a team with a full fixture list, so the
        // absence is left to the error boundary to report honestly.
        return yield* bff.getMatches(psdTeamId);
        // `force-dynamic`: a transient failure always hits the error
        // boundary on this exact request either way, same as before —
        // `Effect.orDie` only makes that pre-existing decision visible to
        // the narrowed `runPromise` signature (#2864).
      }).pipe(Effect.orDie),
    );
  }

  const matches = rawMatches.map(transformMatchToSchedule);
  const monthGroups = groupByMonth(matches);
  const now = new Date();
  const nextMatch = findNextMatch(matches, now);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Ploegen", url: `${SITE_CONFIG.siteUrl}/ploegen` },
          {
            name: displayName,
            url: `${SITE_CONFIG.siteUrl}/ploegen/${slug}`,
          },
          { name: "Wedstrijden", url: pageUrl },
        ])}
      />
      <JsonLd data={buildSportsTeamJsonLd({ name: team.name, url: pageUrl })} />

      <AgendaScrollToNext nextMatchId={nextMatch?.id ?? null} />

      <PageContainer className="pb-12 lg:pb-16">
        {/* No kicker: the up-link `<PageHero>` renders above itself already
            names the parent team, so a second `{displayName}` label would
            say it twice (#2442 rule 6 — this is the route's own
            originally-named instance, the inert `<p>{team.name}</p>` that
            predated the current PageHero composition). */}
        <PageHero
          register="minimal"
          headline="Wedstrijden"
          upLink={{ href: `/ploegen/${slug}`, label: displayName }}
        />

        {matches.length === 0 ? (
          // "Nog geen", not "Geen": fixtures still arrive mid-season once the
          // federation releases the calendar (#2427).
          <EmptyState tier="surface" heading="Nog geen wedstrijden gepland">
            {pendingEmptyBody(
              "de kalender is vrijgegeven",
              "de wedstrijden",
              true,
            )}
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-10">
            {monthGroups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                {/* Newspaper month heading — display-big, no rule beneath.
                    `text-display-xl` now carries its own -0.035em tracking
                    (D14/Y8, #2617); the hand-applied `tracking-tight` this
                    replaced was a duplicate of the ramp's own step. */}
                <h2 className="font-display-big text-ink text-display-xl mb-4">
                  {group.monthName}{" "}
                  <em className="text-jersey-deep italic">
                    {group.yearSuffix}
                  </em>
                  .
                </h2>

                <div className="flex flex-col gap-2">
                  {group.matches.map((m) => (
                    <div
                      key={m.id}
                      data-match-id={m.id}
                      data-testid={
                        nextMatch?.id === m.id
                          ? "wedstrijden-next-match"
                          : undefined
                      }
                    >
                      <TeamAgendaRow
                        match={m}
                        kcvvTeamId={psdTeamId}
                        featured={nextMatch?.id === m.id}
                        // One green row inside a month list headed only by
                        // "September '26" — unlike `<TeamMatchesSection>`, this
                        // page has no "Eerstvolgende" heading to say what the
                        // colour means, so the row says it (#2404).
                        //
                        // Only the featured row needs the *slot* word: the rest
                        // sit in date order with scorelines, so "Uitslag" on
                        // each would be noise. Their outcome is a separate
                        // claim and the row names it on its own — the win/loss
                        // tint is not gated by this prop.
                        kind={nextMatch?.id === m.id ? "fixture" : undefined}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}

// Render on every request so the "next match" highlight and live scores
// reflect the current time instead of a stale 1-hour ISR snapshot (this
// low-traffic route rarely regenerated). PSD rate limits stay protected by the
// BFF itself — KV-backed reads plus global rate limiting and single-flight
// (#2326/#2328) — and by the TeamRepository caches underneath; the BffService
// `getMatches` cache that used to be cited here is gone (#2389).
// Mirrors `/kalender`, which is force-dynamic for the same reason.
export const dynamic = "force-dynamic";

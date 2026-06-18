import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DateTime } from "luxon";
import { runPromise } from "@/lib/effect/runtime";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { BffService } from "@/lib/effect/services/BffService";
import type { Match } from "@kcvv/api-contract";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { TeamAgendaRow } from "@/components/team/TeamMatchesSection/TeamAgendaRow";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { PageContainer } from "@/components/design-system/PageContainer";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildSportsTeamJsonLd } from "@/lib/seo/jsonld";
import { transformMatchToSchedule } from "@/components/match";
import type { ScheduleMatch } from "@/components/match/types";
import { AgendaScrollToNext } from "./AgendaScrollToNext";

interface WedstrijdenPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: WedstrijdenPageProps): Promise<Metadata> {
  const { slug } = await params;
  const team = await runPromise(
    Effect.gen(function* () {
      const repo = yield* TeamRepository;
      return yield* repo.findBySlug(slug);
    }),
  );
  if (!team) return { title: "Team niet gevonden | KCVV Elewijt" };

  const title = `Wedstrijden — ${team.name} | KCVV Elewijt`;
  const description = `Volledig wedstrijdschema van ${team.name}.`;
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
        ? [{ url: team.teamImageUrl, alt: `${team.name} teamfoto` }]
        : [DEFAULT_OG_IMAGE],
    },
  };
}

interface MonthGroup {
  label: string;
  monthName: string;
  yearSuffix: string;
  matches: ScheduleMatch[];
}

function groupByMonth(matches: ScheduleMatch[]): MonthGroup[] {
  const sorted = [...matches].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const grouped = new Map<string, MonthGroup>();

  for (const m of sorted) {
    const dt = DateTime.fromJSDate(m.date).setLocale("nl");
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

function findNextMatch(
  matches: ScheduleMatch[],
  now: Date,
): ScheduleMatch | undefined {
  return matches
    .filter((m) => m.status === "scheduled" && m.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
}

export default async function WedstrijdenPage({
  params,
}: WedstrijdenPageProps) {
  const { slug } = await params;

  const team = await runPromise(
    Effect.gen(function* () {
      const repo = yield* TeamRepository;
      return yield* repo.findBySlug(slug);
    }),
  );

  if (!team) notFound();

  const psdTeamId = team.psdId ? parseInt(team.psdId, 10) : NaN;
  const pageUrl = `${SITE_CONFIG.siteUrl}/ploegen/${slug}/wedstrijden`;

  let rawMatches: readonly Match[] = [];
  if (Number.isFinite(psdTeamId) && psdTeamId > 0) {
    rawMatches = await runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff
          .getMatches(psdTeamId)
          .pipe(
            Effect.catchTag("HttpNotFound", () =>
              Effect.sync(() => notFound()),
            ),
          );
      }),
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
            name: team.name,
            url: `${SITE_CONFIG.siteUrl}/ploegen/${slug}`,
          },
          { name: "Wedstrijden", url: pageUrl },
        ])}
      />
      <JsonLd data={buildSportsTeamJsonLd({ name: team.name, url: pageUrl })} />

      <AgendaScrollToNext nextMatchId={nextMatch?.id ?? null} />

      <PageContainer className="py-8 sm:py-12">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-ink-muted font-mono text-xs tracking-widest uppercase">
            {team.name}
          </p>
          <EditorialHeading
            level={1}
            size="display-xl"
            emphasis={{ text: "." }}
          >
            Wedstrijden
          </EditorialHeading>
        </div>

        {matches.length === 0 ? (
          <p
            data-testid="wedstrijden-empty"
            className="text-ink-muted font-mono text-sm tracking-wider uppercase"
          >
            Geen wedstrijden gepland.
          </p>
        ) : (
          <div className="flex flex-col gap-10">
            {monthGroups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                {/* Newspaper month heading — display-big, no rule beneath */}
                <h2 className="font-display-big text-ink mb-4 text-[length:var(--text-display-xl)] leading-[var(--text-display-xl--lh)] tracking-tight">
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

export const revalidate = 3600;

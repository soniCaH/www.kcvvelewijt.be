"use client";

/**
 * TeamCard — the `/hulp` youth team card (#3558, decided in #3420, mock
 * `docs/design/mockups/3420-team-card/`). Rendered above the `<HubSearch>`
 * results when `matchYouthTeams()` finds a youth team: the band, the band's
 * coordinator, the TVJO and a "Staf van …" link per team. People rows reuse
 * the finder's `<ContactCard>` person vocabulary; no trainer names.
 *
 * Renders from a match result alone (plus the organigram nodes), so the AI
 * "Bedoel je …?" step (`<TeamGuessCard>`, #3559) opens the same card after a
 * confirm.
 */

import { useId, type ReactNode } from "react";
import Link from "next/link";
import {
  TVJO_ROLE_CODE,
  YOUTH_COORDINATOR_ROLE_CODES,
} from "@kcvv/api-contract";
import { Button } from "@/components/design-system/Button";
import { LinkPendingDots } from "@/components/design-system/LinkPendingDots";
import { ArrowRight } from "@/lib/icons.redesign";
import { ContactCard } from "@/components/hulp/HulpFinder/ContactCard";
import { teamDisplayName } from "@/lib/utils/team-display-name";
import type {
  YouthTeamMatch,
  YouthTeamMatchResult,
  YouthTeamSource,
} from "@/lib/utils/match-youth-team";
import type { OrgChartNode } from "@/types/organigram";

export interface TeamCardProps {
  /** A non-empty `matchYouthTeams()` result. */
  result: YouthTeamMatchResult;
  /** Organigram nodes — the coordinator and TVJO boxes are read by `roleCode`. */
  nodes: OrgChartNode[];
}

const STAFF_LINK_CLASS =
  "text-jersey-deep border-jersey-deep hover:bg-jersey-deep hover:text-cream inline-flex items-center gap-1.5 border-[1.5px] px-2.5 py-2 font-mono text-label-sm font-semibold uppercase transition-colors";
const SECTION_HEADING_CLASS =
  "font-display text-ink mt-3.5 mb-2 border-t-[1.5px] pt-3 text-base font-semibold";
const BIRTH_YEAR_CLASS =
  "text-ink-muted mb-1 block font-mono text-label-sm font-semibold uppercase";

const code = (category: number) => `U${category}`;

/** "U12 · Middenbouw" — U5 has no band, so it reads bare. */
function BandTitle({ label, match }: { label: string; match: YouthTeamMatch }) {
  if (match.category === 5) return <>{label}</>;
  return (
    <>
      {label} · <em className="font-normal italic">{match.band}</em>
    </>
  );
}

/** The box for `roleCode` and its named holders; `null` when it is missing or vacant. */
function filledBox(nodes: OrgChartNode[], roleCode: string) {
  const node = nodes.find((n) => n.roleCode === roleCode);
  const holders = node?.members.filter((m) => m.name?.trim()) ?? [];
  return node && holders.length > 0 ? { node, holders } : null;
}

/** The holders of one box, as `<ContactCard>` rows; nothing when it is vacant. */
function People({
  nodes,
  roleCode,
}: {
  nodes: OrgChartNode[];
  roleCode: string;
}) {
  const box = filledBox(nodes, roleCode);
  if (!box) return null;
  const { node, holders } = box;
  return (
    <div className="mb-2 flex flex-col gap-2">
      {holders.map((m) => (
        <ContactCard
          key={m.id}
          contact={{
            name: m.name ?? "",
            role: node.title,
            ...(m.imageUrl ? { imageUrl: m.imageUrl } : {}),
            ...(m.email ? { email: m.email } : {}),
            ...(m.phone ? { phone: m.phone } : {}),
          }}
        />
      ))}
    </div>
  );
}

function StaffLinks({ teams }: { teams: YouthTeamSource[] }) {
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {teams.map((team) => (
        <Link
          key={team._id}
          // `#staf` exists only on a team page that lists staff.
          href={`/ploegen/${team.slug}${team.hasStaff ? "#staf" : ""}`}
          className={STAFF_LINK_CLASS}
        >
          Staf van {teamDisplayName(team)}
          <ArrowRight size={12} aria-hidden />
          <LinkPendingDots spaced={false} />
        </Link>
      ))}
    </div>
  );
}

function NextTeamUpHint({ match }: { match: YouthTeamMatch }) {
  if (!match.nextTeamUp) return null;
  return (
    <p className="text-ink mb-2.5 text-sm">
      We hebben geen {code(match.requestedCategory)}. Spelers van die leeftijd
      spelen bij de {code(match.category)}.
    </p>
  );
}

function LateBornNote({ match }: { match: YouthTeamMatch }) {
  const alt = match.lateBornAlternative;
  if (!alt) return null;
  return (
    // A cream step, not `warning-soft`: the soft status tints belong to the
    // Alert variants, and this is a note, not a warning (DESIGN.md → Manila).
    <div className="bg-cream-soft text-ink text-body-sm mt-3 px-3 py-2.5">
      <p>
        Geboren tussen juli en december? Dan mag je kind ook in de{" "}
        <b>{code(alt.category)}</b> spelen — de coördinator beslist.
      </p>
      <div className="mt-2">
        <StaffLinks teams={alt.teams} />
      </div>
    </div>
  );
}

/** The card's paper frame: kicker, `<h2>` title, then the body. */
function CardFrame({
  kicker,
  title,
  children,
}: {
  kicker: ReactNode;
  title: ReactNode;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="border-ink bg-cream border-2 p-3.5 shadow-[var(--shadow-paper-sm)]"
    >
      <p className="text-jersey-deep text-label-sm mb-1.5 font-mono font-semibold uppercase">
        {kicker}
      </p>
      <h2
        id={headingId}
        className="font-display text-ink text-display-sm mb-3 font-semibold"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function kickerFor(matches: YouthTeamMatch[], sectioned: boolean): string {
  const first = matches[0];
  if (first.kind === "age" && first.age != null)
    return sectioned
      ? `${first.age} jaar — hangt af van het geboortejaar`
      : `${first.age} jaar`;
  if (first.kind === "old-name" && first.oldName)
    return `${first.oldName.charAt(0).toUpperCase()}${first.oldName.slice(1)} = ${matches
      .map((m) => code(m.category))
      .join(" en ")}`;
  if (first.kind === "birth-year" && first.birthYear != null)
    return first.nextTeamUp
      ? `Geboren in ${first.birthYear} = ${code(first.requestedCategory)}`
      : `Geboren in ${first.birthYear}`;
  return "Jouw ploeg";
}

export function TeamCard({ result, nodes }: TeamCardProps) {
  const matches = result.bands.flatMap((b) => b.matches);
  const first = matches[0];
  const last = matches.at(-1);
  if (!first || !last) return null;

  // One section per match when the asked age spans two birth years, or the
  // matches span bands — each section then carries its own coordinator.
  const sectioned =
    matches.length > 1 && (first.kind === "age" || result.bands.length > 1);

  return (
    <CardFrame
      kicker={kickerFor(matches, sectioned)}
      title={
        sectioned ? (
          matches
            .map((m) => code(m.category))
            .join(first.kind === "age" ? " of " : " en ")
        ) : (
          <BandTitle
            match={first}
            label={
              matches.length > 1
                ? `${code(first.category)}–${code(last.category)}`
                : code(first.category)
            }
          />
        )
      }
    >
      {sectioned ? (
        <>
          {matches.map((m) => (
            <div key={m.category}>
              <h3
                className={`${SECTION_HEADING_CLASS} border-ink-muted border-dashed`}
              >
                {m.birthYear != null && (
                  <span className={BIRTH_YEAR_CLASS}>
                    Geboren in {m.birthYear}
                  </span>
                )}
                <BandTitle match={m} label={code(m.category)} />
              </h3>
              <NextTeamUpHint match={m} />
              <People
                nodes={nodes}
                roleCode={YOUTH_COORDINATOR_ROLE_CODES[m.band]}
              />
              <StaffLinks teams={m.teams} />
              <LateBornNote match={m} />
            </div>
          ))}
          {filledBox(nodes, TVJO_ROLE_CODE) && (
            <>
              <h3 className={`${SECTION_HEADING_CLASS} border-ink-muted`}>
                Voor alle jeugd
              </h3>
              <People nodes={nodes} roleCode={TVJO_ROLE_CODE} />
            </>
          )}
        </>
      ) : (
        <>
          <NextTeamUpHint match={first} />
          <People
            nodes={nodes}
            roleCode={YOUTH_COORDINATOR_ROLE_CODES[first.band]}
          />
          <People nodes={nodes} roleCode={TVJO_ROLE_CODE} />
          <StaffLinks teams={matches.flatMap((m) => m.teams)} />
          {matches.map((m) => (
            <LateBornNote key={m.category} match={m} />
          ))}
        </>
      )}
    </CardFrame>
  );
}

export interface TeamGuessCardProps {
  /** The card the pick would open — `aiTeamResult()` for the AI's age. */
  result: YouthTeamMatchResult;
  onAnswer: (answer: "yes" | "no") => void;
}

/**
 * The AI fallback asks first (#3559): "Bedoel je deze ploeg?" with the pick's
 * band title. "Ja" opens `<TeamCard>` for it; "Nee" removes it.
 */
export function TeamGuessCard({ result, onAnswer }: TeamGuessCardProps) {
  const first = result.bands[0]?.matches[0];
  if (!first) return null;
  return (
    <CardFrame
      kicker="Bedoel je deze ploeg?"
      title={<BandTitle match={first} label={code(first.category)} />}
    >
      <div className="mt-1 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => onAnswer("yes")}>
          Ja, toon contact
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onAnswer("no")}
        >
          Nee
        </Button>
      </div>
      <p className="text-ink mt-2 text-sm">
        Niet zeker? Zoek op leeftijd, bv. “U9” of “geboren in 2018”.
      </p>
    </CardFrame>
  );
}

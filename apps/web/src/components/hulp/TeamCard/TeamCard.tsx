"use client";

/**
 * TeamCard — the `/hulp` youth team card (#3558, decided in #3420, mock
 * `docs/design/mockups/3420-team-card/`). Rendered above the `<HubSearch>`
 * results when `matchYouthTeams()` finds a youth team: the band, the band's
 * coordinator, the TVJO and a "Staf van …" link per team. People rows reuse
 * the finder's `<ContactCard>` person vocabulary; no trainer names.
 *
 * Renders from a match result alone (plus the organigram nodes), so the AI
 * "Bedoel je …?" step (#3559) can open the same card after a confirm.
 */

import { useId } from "react";
import Link from "next/link";
import { LinkPendingDots } from "@/components/design-system/LinkPendingDots";
import { ArrowRight } from "@/lib/icons.redesign";
import { ContactCard } from "@/components/hulp/HulpFinder/ContactCard";
import { teamDisplayName } from "@/lib/utils/team-display-name";
import type { YouthDivisionName } from "@/lib/utils/group-teams";
import type {
  YouthTeamMatch,
  YouthTeamMatchResult,
  YouthTeamSource,
} from "@/lib/utils/match-youth-team";
import type { OrgChartNode } from "@/types/organigram";

/** The organigram box that coordinates each band (`organigramNode.roleCode`). */
const COORDINATOR_ROLE_CODE: Record<YouthDivisionName, string> = {
  Onderbouw: "JC-OB",
  Middenbouw: "JC-MB",
  Bovenbouw: "JC-BB",
};
const TVJO_ROLE_CODE = "TVJO";

export interface TeamCardProps {
  /** A non-empty `matchYouthTeams()` result. */
  result: YouthTeamMatchResult;
  /** Organigram nodes — the coordinator and TVJO boxes are read by `roleCode`. */
  nodes: OrgChartNode[];
}

const LINK =
  "text-jersey-deep border-jersey-deep hover:bg-jersey-deep hover:text-cream inline-flex items-center gap-1.5 border-[1.5px] px-2.5 py-2 font-mono text-label-sm font-semibold uppercase transition-colors";
const SUB =
  "font-display text-ink mt-3.5 mb-2 border-t-[1.5px] pt-3 text-base font-semibold";
const YEAR =
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

/** The holders of one box, as `<ContactCard>` rows; nothing when it is vacant. */
function People({
  nodes,
  roleCode,
}: {
  nodes: OrgChartNode[];
  roleCode: string;
}) {
  const node = nodes.find((n) => n.roleCode === roleCode);
  const holders = node?.members.filter((m) => m.name?.trim()) ?? [];
  if (!node || holders.length === 0) return null;
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
          href={`/ploegen/${team.slug}#staf`}
          className={LINK}
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
    <p className="text-ink-muted mb-2.5 text-sm">
      We hebben geen {code(match.requestedCategory)}. Spelers van die leeftijd
      spelen bij de {code(match.category)}.
    </p>
  );
}

function LateBornNote({ match }: { match: YouthTeamMatch }) {
  const alt = match.lateBornAlternative;
  if (!alt) return null;
  return (
    <div className="bg-warning-soft border-warm text-body-sm mt-3 border-l-4 px-3 py-2.5">
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
  const headingId = useId();
  const matches = result.bands.flatMap((b) => b.matches);
  const first = matches[0];
  const last = matches.at(-1);
  if (!first || !last) return null;

  // One section per match when the asked age spans two birth years, or the
  // matches span bands — each section then carries its own coordinator.
  const sectioned =
    matches.length > 1 && (first.kind === "age" || result.bands.length > 1);

  return (
    <section
      aria-labelledby={headingId}
      className="border-ink bg-cream border-2 p-3.5 shadow-[var(--shadow-paper-sm)]"
    >
      <p className="text-jersey-deep text-label-sm mb-1.5 font-mono font-semibold uppercase">
        {kickerFor(matches, sectioned)}
      </p>
      <h2
        id={headingId}
        className="font-display text-ink text-display-sm mb-3 font-semibold"
      >
        {sectioned ? (
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
        )}
      </h2>

      {sectioned ? (
        <>
          {matches.map((m) => (
            <div key={m.category}>
              <h3 className={`${SUB} border-ink-muted border-dashed`}>
                {m.birthYear != null && (
                  <span className={YEAR}>Geboren in {m.birthYear}</span>
                )}
                <BandTitle match={m} label={code(m.category)} />
              </h3>
              <NextTeamUpHint match={m} />
              <People nodes={nodes} roleCode={COORDINATOR_ROLE_CODE[m.band]} />
              <StaffLinks teams={m.teams} />
              <LateBornNote match={m} />
            </div>
          ))}
          <h3 className={`${SUB} border-ink-muted`}>Voor alle jeugd</h3>
          <People nodes={nodes} roleCode={TVJO_ROLE_CODE} />
        </>
      ) : (
        <>
          <NextTeamUpHint match={first} />
          <People nodes={nodes} roleCode={COORDINATOR_ROLE_CODE[first.band]} />
          <People nodes={nodes} roleCode={TVJO_ROLE_CODE} />
          <StaffLinks teams={matches.flatMap((m) => m.teams)} />
          {matches.map((m) => (
            <LateBornNote key={m.category} match={m} />
          ))}
        </>
      )}
    </section>
  );
}

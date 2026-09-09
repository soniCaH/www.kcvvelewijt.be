import type { PlayerVM } from "@/lib/repositories/player.repository";
import { PlayerCard } from "./PlayerCard";
import { PersonCardRun } from "./PersonCardRun";

export interface SquadGridProps {
  players: readonly PlayerVM[];
}

/**
 * Stable, non-display identifier for the trailing catch-all bucket — never
 * compared against its Dutch heading text ("Spelers"). The single-group gate
 * below keys off this id, not the display string, for the same reason
 * `player.repository.ts` maps to a display label instead of using one as a
 * control value (#2638 review): the next person to reword "Spelers" would
 * otherwise silently break the gate.
 */
const CATCH_ALL_ID = "catch-all";

/**
 * Dutch collation for the lastName fallback (#2894) — so `Van Hof` and
 * `Van Hóf` sort by their base letters first, diacritic as tie-break only,
 * instead of a bare `<` putting the accented byte in the wrong place.
 * Module-level: one collator, not rebuilt per render or per comparison.
 */
const lastNameCollator = new Intl.Collator("nl");

/**
 * Within-group squad order (#2894): `jerseyNumber` ascending, then
 * `lastName` — both as the primary key's tiebreak (two players can share a
 * number: a mid-season departure and arrival both wearing 7, or a youth
 * squad reusing numbers, and the read-only field means nobody can fix it by
 * hand) and as the fallback when either side has no number. Numbered
 * players always sort before unnumbered ones — a partial roster must not
 * interleave the two. `jerseyNumber` is editorial and, measured
 * 2026-09-09, unset on every active player, so on today's data this is
 * pure last-name order; it becomes number order as editors fill it in.
 */
function compareSquadOrder(a: PlayerVM, b: PlayerVM): number {
  if (a.number !== undefined && b.number !== undefined) {
    return (
      a.number - b.number || lastNameCollator.compare(a.lastName, b.lastName)
    );
  }
  if (a.number !== undefined) return -1;
  if (b.number !== undefined) return 1;
  return lastNameCollator.compare(a.lastName, b.lastName);
}

interface PositionGroup {
  /** Stable identifier — never rendered, never compared against display text. */
  id: string;
  /** Plural Dutch group heading. */
  label: string;
  /** Singular position value(s) that fall into this group. */
  match: (position: string | undefined) => boolean;
}

// Ordered front-to-back: keepers → defenders → midfielders → attackers, with
// a trailing catch-all so no player is dropped — unmapped and unauthored
// (#2567) positions both land there.
const GROUPS: PositionGroup[] = [
  { id: "keeper", label: "Doelmannen", match: (p) => p === "Keeper" },
  { id: "defender", label: "Verdedigers", match: (p) => p === "Verdediger" },
  {
    id: "midfielder",
    label: "Middenvelders",
    match: (p) => p === "Middenvelder",
  },
  { id: "attacker", label: "Aanvallers", match: (p) => p === "Aanvaller" },
];

function partition(players: readonly PlayerVM[]): {
  id: string;
  label: string;
  players: PlayerVM[];
}[] {
  const assigned = new Set<string>();
  const result: { id: string; label: string; players: PlayerVM[] }[] = [];

  for (const group of GROUPS) {
    const members = players.filter((p) => group.match(p.position));
    if (members.length > 0) {
      members.forEach((m) => assigned.add(m.id));
      result.push({ id: group.id, label: group.label, players: members });
    }
  }

  // Trailing catch-all for any position not in the four canonical groups.
  const rest = players.filter((p) => !assigned.has(p.id));
  if (rest.length > 0) {
    result.push({ id: CATCH_ALL_ID, label: "Spelers", players: rest });
  }

  // Applied once, over every group including the catch-all, rather than
  // per-group above — so #2894's order is never a rule one bucket forgets.
  for (const group of result) {
    group.players.sort(compareSquadOrder);
  }

  return result;
}

export function SquadGrid({ players }: SquadGridProps) {
  if (players.length === 0) return null;

  const groups = partition(players);
  // The catch-all separates nobody from a neighbour when it is the ONLY
  // group — the heading gains a gate for exactly the same reason the
  // position label itself did (#2638): rendering "Spelers" over the only
  // group on a U9 page (nobody's position is known) claims a distinction
  // the data doesn't support. This is deliberately narrower than "any
  // single group": a lone REAL position bucket (e.g. a squad that is,
  // today, entirely keepers) is still a true classification and keeps its
  // heading — it only looks unearned by accident of today's data, and
  // hiding it would be latent breakage waiting for a squad shape that
  // exposes it. Keyed off the group's stable `id`, never its display
  // label, so a rewording of "Spelers" can't silently break the gate.
  const hideHeading = groups.length === 1 && groups[0]!.id === CATCH_ALL_ID;

  return (
    <div data-testid="squad-grid" className="flex flex-col gap-8">
      {groups.map((group) => (
        <PersonCardRun
          key={group.id}
          label={group.label}
          hideHeading={hideHeading}
        >
          {group.players.map((p) => (
            <PlayerCard
              key={p.id}
              id={p.id}
              firstName={p.firstName}
              lastName={p.lastName}
              position={p.position}
              jerseyNumber={p.number}
              photoUrl={p.imageUrl}
              href={p.href}
            />
          ))}
        </PersonCardRun>
      ))}
    </div>
  );
}

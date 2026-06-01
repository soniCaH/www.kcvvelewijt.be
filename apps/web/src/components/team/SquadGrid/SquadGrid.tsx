import type { PlayerVM } from "@/lib/repositories/player.repository";
import { PlayerCard } from "./PlayerCard";

export interface SquadGridProps {
  players: readonly PlayerVM[];
}

interface PositionGroup {
  /** Plural Dutch group heading. */
  label: string;
  /** Singular position value(s) that fall into this group. */
  match: (position: string) => boolean;
}

// Ordered front-to-back: keepers → defenders → midfielders → attackers,
// with a trailing catch-all so no player is dropped (youth often "Speler").
const GROUPS: PositionGroup[] = [
  { label: "Doelmannen", match: (p) => p === "Keeper" },
  { label: "Verdedigers", match: (p) => p === "Verdediger" },
  { label: "Middenvelders", match: (p) => p === "Middenvelder" },
  { label: "Aanvallers", match: (p) => p === "Aanvaller" },
];

function partition(players: readonly PlayerVM[]): {
  label: string;
  players: PlayerVM[];
}[] {
  const assigned = new Set<string>();
  const result: { label: string; players: PlayerVM[] }[] = [];

  for (const group of GROUPS) {
    const members = players.filter((p) => group.match(p.position));
    if (members.length > 0) {
      members.forEach((m) => assigned.add(m.id));
      result.push({ label: group.label, players: members });
    }
  }

  // Trailing catch-all for any position not in the four canonical groups.
  const rest = players.filter((p) => !assigned.has(p.id));
  if (rest.length > 0) {
    result.push({ label: "Spelers", players: rest });
  }

  return result;
}

export function SquadGrid({ players }: SquadGridProps) {
  if (players.length === 0) return null;

  const groups = partition(players);

  return (
    <div data-testid="squad-grid" className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h3 className="text-ink-muted border-paper-edge mb-3 border-b pb-1.5 font-mono text-[11px] tracking-[0.1em] uppercase">
            {group.label}
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
            {group.players.map((p) => (
              <PlayerCard
                key={p.id}
                firstName={p.firstName}
                lastName={p.lastName}
                position={p.position}
                jerseyNumber={p.number}
                photoUrl={p.imageUrl}
                href={p.href}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import type { YouthDivisionGroup } from "@/lib/utils/group-teams";

export interface YouthDirectoryProps {
  divisions: readonly YouthDivisionGroup[];
  className?: string;
}

/**
 * Youth-team directory for `/ploegen`. Grouped Bovenbouw / Middenbouw /
 * Onderbouw (per [[project_youth_divisions]]); each group is a grid of compact
 * age-code cards linking to the team detail. Youth teams carry no per-team
 * crest, so the age code itself is the card's identity. Empty groups are
 * omitted; the whole block hides when no youth teams exist.
 */
export function YouthDirectory({ divisions, className }: YouthDirectoryProps) {
  const groups = divisions.filter((d) => d.teams.length > 0);
  if (groups.length === 0) return null;

  return (
    <section
      data-testid="youth-directory"
      aria-label="Jeugdwerking"
      className={cn("flex flex-col gap-10", className)}
    >
      <EditorialHeading level={2} size="display-md" emphasis={{ text: "." }}>
        Jeugdwerking
      </EditorialHeading>

      {groups.map((group) => (
        <div key={group.label} data-testid="youth-division">
          <h3 className="text-ink-muted border-paper-edge mb-4 border-b pb-1.5 font-mono text-[11px] tracking-[0.1em] uppercase">
            {group.label} · {group.range}
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {group.teams.map((team) => (
              <Link
                key={team._id}
                href={`/ploegen/${team.slug}`}
                data-testid="youth-team-card"
                aria-label={`${team.name} — bekijk ploeg`}
                className={cn(
                  "border-ink bg-cream flex flex-col items-center gap-1 border-2 px-3 py-4 text-center",
                  "shadow-[3px_3px_0_0_var(--color-ink)] transition-all duration-300",
                  "hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
                )}
              >
                <span className="font-display-big text-jersey-deep text-2xl font-black tabular-nums">
                  {team.age}
                </span>
                <span className="text-ink-muted font-mono text-[9px] tracking-[0.08em] uppercase">
                  KCVV Elewijt
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

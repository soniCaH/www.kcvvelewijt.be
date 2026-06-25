import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { TapedCard } from "@/components/design-system/TapedCard";
import { JerseyShirt } from "@/components/design-system/JerseyShirt";
import type { YouthDivisionGroup } from "@/lib/utils/group-teams";

export interface YouthDirectoryProps {
  divisions: readonly YouthDivisionGroup[];
  className?: string;
}

// Subtle ±1° scrapbook tilt, cycled by index (design lock 7j5). Kept small so a
// full division reads as character, not noise.
const CARD_ROTATIONS = [-1.1, 0.7, -0.5];

/**
 * Youth-team directory (`/jeugd` + `/ploegen`). Grouped Bovenbouw / Middenbouw /
 * Onderbouw (per [[project_youth_divisions]]); each team is a taped polaroid of
 * its squad photo (`team.teamImageUrl`, backfilled in #2070) with the age code
 * as the caption — design locks 7j4 (variant C) + 7j5 (age-code-only · subtle
 * rotation · newsprint colour). Teams without a photo fall back to the canonical
 * `<JerseyShirt>` illustration. Empty groups are omitted; the whole block hides
 * when no youth teams exist.
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
          <h3 className="text-ink-muted border-paper-edge mb-5 border-b pb-1.5 font-mono text-[11px] tracking-[0.1em] uppercase">
            {group.label} · {group.range}
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-7">
            {group.teams.map((team, index) => (
              <Link
                key={team._id}
                href={`/ploegen/${team.slug}`}
                data-testid="youth-team-card"
                aria-label={`${team.name} — bekijk ploeg`}
                className="block"
              >
                <TapedCard
                  rotation={CARD_ROTATIONS[index % CARD_ROTATIONS.length]}
                  tape={{
                    color: "warm",
                    length: "sm",
                    position: index % 2 === 0 ? "left" : "right",
                    rotation: "a",
                  }}
                  bg="cream"
                  padding="sm"
                  interactive="press"
                >
                  <div className="border-ink relative aspect-[4/3] w-full overflow-hidden border">
                    {team.teamImageUrl ? (
                      <Image
                        src={team.teamImageUrl}
                        alt={`${team.name} ploegfoto`}
                        fill
                        // Sanity CDN URL already carries ?w/q/fm transforms —
                        // skip /_next/image (matches TeamFlagship/PlayerCard/TeamStaff).
                        unoptimized
                        sizes="(min-width: 768px) 200px, 45vw"
                        className="object-cover"
                        style={{ filter: "var(--filter-photo-newsprint)" }}
                      />
                    ) : (
                      <div className="bg-cream-soft flex h-full w-full items-center justify-center">
                        <JerseyShirt
                          letterOverlay={team.age}
                          ariaLabel={`${team.name} (geen ploegfoto)`}
                          className="h-full max-h-24 w-auto py-2"
                        />
                      </div>
                    )}
                  </div>
                  <p className="font-display-big text-jersey-deep mt-2 text-center text-2xl font-black tabular-nums">
                    {team.age}
                  </p>
                  {/* TEAMS-2 / JEUGD-1: same-age teams (U9 wit/groen/prov)
                      need a distinguisher — show the full division/name when
                      it adds detail beyond the age. */}
                  {(team.divisionFull ?? team.name).toLowerCase() !==
                  team.age.toLowerCase() ? (
                    <p className="text-ink-soft mt-0.5 text-center font-mono text-[10px] leading-tight tracking-[0.08em] uppercase">
                      {team.divisionFull ?? team.name}
                    </p>
                  ) : null}
                </TapedCard>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

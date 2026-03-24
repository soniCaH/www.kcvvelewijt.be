import Link from "next/link";
import Image from "next/image";
import type { TeamLandingItem } from "@/lib/utils/group-teams";

export interface TeamsHeroProps {
  team: TeamLandingItem;
}

export function TeamsHero({ team }: TeamsHeroProps) {
  return (
    <div className="relative min-h-[70vh] flex items-end">
      {/* Background image */}
      {team.teamImageUrl && (
        <div className="absolute inset-0">
          <Image
            src={team.teamImageUrl}
            alt={`Team foto ${team.name}`}
            fill
            className="object-cover"
            style={{ filter: "brightness(0.4)" }}
            priority
            sizes="100vw"
          />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-kcvv-black via-kcvv-black/85 via-40% to-kcvv-black/20" />

      {/* Content */}
      <div className="relative z-10 max-w-[70rem] mx-auto px-4 md:px-10 py-10 md:py-16 w-full">
        {/* Label */}
        <div className="flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-white/50 mb-6">
          <span className="block w-5 h-0.5 bg-white/30" />
          Eerste ploeg
        </div>

        {/* Team name */}
        <h1
          className="font-title font-black text-white uppercase leading-[0.9] mb-3"
          style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}
        >
          {(() => {
            const parts = team.name.split(/\s+/);
            if (parts.length >= 2) {
              return (
                <>
                  {parts[0]}
                  <br />
                  <span className="text-kcvv-green">{parts[1]}</span>
                  {parts.length > 2 ? ` ${parts.slice(2).join(" ")}` : ""}
                </>
              );
            }
            return team.name;
          })()}
        </h1>

        {/* Division */}
        {team.divisionFull && (
          <p
            className="font-title font-bold text-white/60 mb-10"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}
          >
            {team.divisionFull}
          </p>
        )}

        {/* CTA */}
        <Link
          href={`/team/${team.slug}`}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-kcvv-green text-kcvv-black font-bold text-sm uppercase tracking-[0.08em] rounded-sm transition-colors hover:bg-kcvv-green-hover"
        >
          Bekijk de A-ploeg →
        </Link>
      </div>
    </div>
  );
}

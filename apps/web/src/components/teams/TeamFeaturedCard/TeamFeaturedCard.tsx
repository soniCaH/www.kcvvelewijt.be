import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";
import type { TeamLandingItem } from "@/lib/utils/group-teams";

export interface TeamFeaturedCardProps {
  team: TeamLandingItem;
  label: string;
}

export function TeamFeaturedCard({ team, label }: TeamFeaturedCardProps) {
  return (
    <div className="mx-auto max-w-[70rem] px-4 md:px-10">
      <div className="grid grid-cols-1 overflow-hidden rounded-sm bg-white shadow-sm md:grid-cols-2">
        {/* Left column — Photo */}
        <div className="relative min-h-[220px] md:min-h-[340px]">
          {team.teamImageUrl ? (
            <>
              <Image
                src={team.teamImageUrl}
                alt={`Team foto ${team.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="from-kcvv-green-dark/30 absolute inset-0 bg-gradient-to-br to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <Users className="h-16 w-16 text-gray-300" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Right column — Content */}
        <div className="flex flex-col justify-center p-8 md:p-12">
          {/* Label */}
          <div className="text-kcvv-gray mb-4 flex items-center gap-2 text-[0.6875rem] font-extrabold tracking-[0.14em] uppercase">
            <span className="bg-kcvv-green block h-0.5 w-5" />
            {label}
          </div>

          {/* Team name */}
          <h2
            className="font-title text-kcvv-gray-blue mb-3 leading-none font-black uppercase"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            {team.name}
          </h2>

          {/* Division */}
          {team.divisionFull && (
            <p className="text-kcvv-gray mb-6 text-[0.9375rem]">
              {team.divisionFull}
            </p>
          )}

          {/* CTA */}
          <Link
            href={`/ploegen/${team.slug}`}
            className="bg-kcvv-black hover:bg-kcvv-green-dark inline-flex w-fit items-center gap-2 rounded-sm px-6 py-3 text-[0.8125rem] font-bold tracking-[0.08em] text-white uppercase transition-colors"
          >
            Bekijk de ploeg →
          </Link>
        </div>
      </div>
    </div>
  );
}

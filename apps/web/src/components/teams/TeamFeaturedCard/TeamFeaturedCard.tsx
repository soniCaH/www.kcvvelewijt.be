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
    <div className="max-w-[70rem] mx-auto px-4 md:px-10">
      <div className="grid grid-cols-1 md:grid-cols-2 bg-white rounded-sm overflow-hidden shadow-sm">
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
              <div className="absolute inset-0 bg-gradient-to-br from-kcvv-green-dark/30 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <Users className="w-16 h-16 text-gray-300" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Right column — Content */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          {/* Label */}
          <div className="flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-kcvv-gray mb-4">
            <span className="block w-5 h-0.5 bg-kcvv-green" />
            {label}
          </div>

          {/* Team name */}
          <h2
            className="font-title font-black text-kcvv-gray-blue uppercase leading-none mb-3"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            {team.name}
          </h2>

          {/* Division */}
          {team.divisionFull && (
            <p className="text-[0.9375rem] text-kcvv-gray mb-6">
              {team.divisionFull}
            </p>
          )}

          {/* CTA */}
          <Link
            href={`/team/${team.slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-kcvv-black text-white font-bold text-[0.8125rem] uppercase tracking-[0.08em] rounded-sm w-fit transition-colors hover:bg-kcvv-green-dark"
          >
            Bekijk de ploeg →
          </Link>
        </div>
      </div>
    </div>
  );
}

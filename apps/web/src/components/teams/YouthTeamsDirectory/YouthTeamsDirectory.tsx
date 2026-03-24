import Link from "next/link";
import { SectionHeader } from "@/components/design-system/SectionHeader/SectionHeader";
import type { YouthDivisionGroup } from "@/lib/utils/group-teams";

export interface YouthTeamsDirectoryProps {
  divisions: YouthDivisionGroup[];
}

export function YouthTeamsDirectory({ divisions }: YouthTeamsDirectoryProps) {
  return (
    <div className="max-w-[70rem] mx-auto px-4 md:px-10">
      <SectionHeader
        title="Jeugdploegen"
        linkText="Jeugdwerking"
        linkHref="/jeugd"
        variant="dark"
      />

      {divisions.map((division, i) => (
        <div
          key={division.label}
          className={i < divisions.length - 1 ? "mb-10" : undefined}
        >
          {/* Group title */}
          <div className="font-title font-bold text-sm uppercase tracking-[0.1em] text-white/45 mb-4 flex items-center gap-3">
            {division.label} ({division.range})
            <span className="flex-1 h-px bg-white/10" />
          </div>

          {/* Team grid */}
          {division.teams.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {division.teams.map((team) => (
                <Link
                  key={team._id}
                  href={`/team/${team.slug}`}
                  className="flex items-center gap-4 px-5 py-4 bg-white/8 border border-white/8 rounded-sm no-underline transition-colors hover:bg-white/[0.14] hover:border-white/15"
                >
                  {/* Badge circle */}
                  <div className="flex items-center justify-center w-12 h-12 bg-kcvv-green/15 rounded-full shrink-0">
                    <span className="font-title font-black text-sm text-kcvv-green">
                      {team.age}
                    </span>
                  </div>

                  {/* Team name */}
                  <span className="font-title font-bold text-[0.9375rem] text-white truncate">
                    {team.name}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm">Geen ploegen</p>
          )}
        </div>
      ))}
    </div>
  );
}

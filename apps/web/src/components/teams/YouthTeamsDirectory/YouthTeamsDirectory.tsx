import Link from "next/link";
import { SectionHeader } from "@/components/design-system/SectionHeader/SectionHeader";
import type { YouthDivisionGroup } from "@/lib/utils/group-teams";

export interface YouthTeamsDirectoryProps {
  divisions: YouthDivisionGroup[];
}

export function YouthTeamsDirectory({ divisions }: YouthTeamsDirectoryProps) {
  return (
    <div className="mx-auto max-w-[70rem] px-4 md:px-10">
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
          <div className="font-title mb-4 flex items-center gap-3 text-sm font-bold tracking-[0.1em] text-white/45 uppercase">
            {division.label} ({division.range})
            <span className="h-px flex-1 bg-white/10" />
          </div>

          {/* Team grid */}
          {division.teams.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {division.teams.map((team) => (
                <Link
                  key={team._id}
                  href={`/ploegen/${team.slug}`}
                  className="flex items-center gap-4 rounded-sm border border-white/8 bg-white/8 px-5 py-4 no-underline transition-colors hover:border-white/15 hover:bg-white/[0.14]"
                >
                  {/* Badge circle */}
                  <div className="bg-kcvv-green/15 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
                    <span className="font-title text-kcvv-green text-sm font-black">
                      {team.age}
                    </span>
                  </div>

                  {/* Team name */}
                  <span className="font-title truncate text-[0.9375rem] font-bold text-white">
                    {team.name}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/30">Geen ploegen</p>
          )}
        </div>
      ))}
    </div>
  );
}

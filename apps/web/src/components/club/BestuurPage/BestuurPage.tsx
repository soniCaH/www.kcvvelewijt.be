/**
 * BestuurPage Component
 *
 * Presentational layout for /club/bestuur.
 * Renders a club-team header, a description section above the member roster,
 * and an organigram call-to-action card. No matches or standings.
 */

import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import { TeamHeader, type TeamHeaderProps } from "@/components/team/TeamHeader";
import {
  TeamRoster,
  type RosterPlayer,
  type StaffMember,
} from "@/components/team/TeamRoster";
import { Network } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";

export interface BestuurPageProps {
  /** Props forwarded to TeamHeader */
  header: TeamHeaderProps;
  /** Sanitised HTML description shown above the roster */
  description?: string;
  /** Board members rendered as staff cards */
  staff?: StaffMember[];
  /** Players (rarely set for board teams, included for completeness) */
  players?: RosterPlayer[];
  /** Additional CSS classes for the content wrapper */
  className?: string;
}

export function BestuurPage({
  header,
  description,
  staff = [],
  players = [],
  className,
}: BestuurPageProps) {
  const hasMembers = players.length > 0 || staff.length > 0;

  return (
    <>
      <TeamHeader {...header} teamType="club" />

      <div className={cn("container mx-auto px-4 py-12 space-y-12", className)}>
        {/* Description — green left-border accent, rendered above the roster */}
        {description && (
          <section className="max-w-3xl border-l-4 border-kcvv-green-bright pl-6">
            <div
              className="prose prose-gray"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(description),
              }}
            />
          </section>
        )}

        {/* Member roster */}
        {hasMembers && (
          <section>
            <TeamRoster
              players={players}
              staff={staff}
              teamName={header.name}
              groupByPosition={false}
              showStaff={true}
              staffSectionLabel={null}
            />
          </section>
        )}

        {/* Organigram CTA */}
        <section className="rounded-xl bg-kcvv-green-dark text-white p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Network
              className="w-8 h-8 shrink-0 opacity-80"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-xl font-bold">Volledig organigram</h2>
              <p className="text-white/80 text-sm mt-1">
                Bekijk de volledige clubstructuur met alle rollen en
                verantwoordelijkheden.
              </p>
            </div>
          </div>
          <Link
            href="/club/organigram"
            className="shrink-0 rounded-lg bg-white text-kcvv-green-dark font-semibold px-6 py-3 hover:bg-kcvv-green-bright hover:text-white transition-colors"
          >
            Naar organigram
          </Link>
        </section>
      </div>
    </>
  );
}

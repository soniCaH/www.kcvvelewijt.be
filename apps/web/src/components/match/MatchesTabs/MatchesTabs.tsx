/**
 * MatchesTabs Component
 *
 * Tabbed interface splitting matches into "Aankomend" and "Resultaten"
 * using the FilterTabs design-system component.
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { FilterTabs } from "@/components/design-system/FilterTabs/FilterTabs";
import { MatchList } from "../MatchList/MatchList";
import type { UpcomingMatch } from "@/components/match/types";

export interface MatchesTabsProps {
  /** All matches — component splits them by status */
  matches: UpcomingMatch[];
  /** Team ID to highlight */
  highlightTeamId?: number;
  /** Which tab to show by default */
  defaultTab?: "upcoming" | "results";
  /** Additional CSS classes */
  className?: string;
}

const TABS = [
  { value: "upcoming", label: "Aankomend" },
  { value: "results", label: "Resultaten" },
];

export const MatchesTabs = ({
  matches,
  highlightTeamId,
  defaultTab = "upcoming",
  className,
}: MatchesTabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const upcoming = matches.filter((m) => m.status === "scheduled");
  const results = matches.filter((m) =>
    ["finished", "forfeited", "postponed", "stopped"].includes(m.status),
  );

  const tabsWithCounts = TABS.map((t) => ({
    ...t,
    count: t.value === "upcoming" ? upcoming.length : results.length,
  }));

  return (
    <div className={cn(className)}>
      <FilterTabs
        tabs={tabsWithCounts}
        activeTab={activeTab}
        onChange={(value) => setActiveTab(value as "upcoming" | "results")}
        showCounts
        className="mb-4"
      />

      {activeTab === "upcoming" && (
        <MatchList
          matches={upcoming}
          highlightTeamId={highlightTeamId}
          emptyMessage="Geen aankomende wedstrijden."
        />
      )}
      {activeTab === "results" && (
        <MatchList
          matches={results}
          highlightTeamId={highlightTeamId}
          emptyMessage="Geen recente resultaten."
        />
      )}
    </div>
  );
};

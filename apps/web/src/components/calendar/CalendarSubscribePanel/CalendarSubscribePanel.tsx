"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils/cn";
import { RemovableChip } from "@/components/design-system";
import type { CalendarTeamInfo } from "@/app/(main)/kalender/utils";

export interface CalendarSubscribePanelProps {
  teams: CalendarTeamInfo[];
  preselectedTeamLabel?: string;
  isOpen: boolean;
}

type Side = "all" | "home" | "away";

const SIDE_TABS: { value: Side; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "home", label: "Thuis" },
  { value: "away", label: "Uit" },
];

function buildWebcalUrl(teamIds: number[], side: Side, host: string): string {
  return `webcal://${host}/api/calendar.ics?teamIds=${teamIds.join(",")}&side=${side}`;
}

function computeInitialSelection(
  teams: CalendarTeamInfo[],
  preselectedTeamLabel?: string,
): Set<string> {
  if (preselectedTeamLabel) {
    const match = teams.find((t) => t.label === preselectedTeamLabel);
    return match ? new Set([match.id]) : new Set(teams.map((t) => t.id));
  }
  return new Set(teams.map((t) => t.id));
}

export function CalendarSubscribePanel({
  teams,
  preselectedTeamLabel,
  isOpen,
}: CalendarSubscribePanelProps) {
  const [selectedTeamIds, setSelectedTeamIds] = useState(() =>
    computeInitialSelection(teams, preselectedTeamLabel),
  );
  const [side, setSide] = useState<Side>("all");
  const [copied, setCopied] = useState(false);

  const host =
    typeof window !== "undefined"
      ? window.location.host
      : (process.env.NEXT_PUBLIC_HOST ?? "kcvvelewijt.be");

  const selectedPsdIds = teams
    .filter((t) => selectedTeamIds.has(t.id))
    .map((t) => t.psdId);

  const webcalUrl = buildWebcalUrl(selectedPsdIds, side, host);

  function removeTeam(teamId: string) {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      next.delete(teamId);
      return next;
    });
  }

  function addTeam(teamId: string) {
    setSelectedTeamIds((prev) => new Set(prev).add(teamId));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(webcalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }

  if (!isOpen) return null;

  const unselectedTeams = teams.filter((t) => !selectedTeamIds.has(t.id));

  return (
    <div
      data-testid="subscribe-panel"
      className="border-paper-edge bg-cream-soft border-b-2 border-dashed p-4"
    >
      {/* Seizoenskaart — a perforated "abonnement" ticket (6d5 lock). The QR
          lives in the always-visible left stub; the body carries the team
          chips + thuis/uit segmented control + a single copy button. The raw
          webcal URL is intentionally not surfaced. */}
      <div className="border-ink bg-cream flex flex-col border-2 sm:flex-row">
        {/* Stub — QR (always visible) */}
        <div className="border-ink bg-cream-soft flex shrink-0 flex-col items-center justify-center gap-2 border-b-2 border-dashed px-5 py-4 sm:border-r-2 sm:border-b-0">
          <div data-testid="qr-code" className="bg-cream border-ink border p-1">
            <QRCodeSVG value={webcalUrl} size={92} />
          </div>
          <span className="text-ink-muted font-mono text-[9px] tracking-wider uppercase">
            Scan → agenda
          </span>
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1 p-4">
          <p className="text-ink-muted font-mono text-[10px] font-semibold tracking-widest uppercase">
            Abonnement
          </p>
          <p className="font-display text-ink mb-3 text-lg font-bold italic">
            Volg je ploeg(en).
          </p>

          {/* Team chips */}
          <div className="mb-3 flex flex-wrap gap-2">
            {teams
              .filter((t) => selectedTeamIds.has(t.id))
              .map((team) => (
                <RemovableChip
                  key={team.id}
                  label={team.label}
                  onRemove={() => removeTeam(team.id)}
                />
              ))}
            {unselectedTeams.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) addTeam(e.target.value);
                  e.target.value = "";
                }}
                className="border-ink bg-cream text-ink border-2 px-2.5 py-1 font-mono text-[11px] font-semibold"
                aria-label="Team toevoegen"
              >
                <option value="">+ voeg toe</option>
                {unselectedTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Side filter (segmented) + copy — equal height */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Filter wedstrijden"
              className="border-ink inline-flex border-2"
            >
              {SIDE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setSide(tab.value)}
                  aria-pressed={side === tab.value}
                  className={cn(
                    "not-last:border-ink px-3 py-1.5 font-mono text-[11px] tracking-wide uppercase transition-colors not-last:border-r-2",
                    side === tab.value
                      ? "bg-ink text-cream"
                      : "text-ink hover:bg-cream-soft",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={selectedPsdIds.length === 0}
              className="border-ink bg-jersey-deep border-2 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wide text-white uppercase shadow-[2px_2px_0_0_var(--color-ink)] transition-all duration-300 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0_0_var(--color-ink)]"
            >
              {copied ? "Gekopieerd" : "Kopieer link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

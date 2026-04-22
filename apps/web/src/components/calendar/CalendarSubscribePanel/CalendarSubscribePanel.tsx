"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { CalendarTeamInfo } from "@/app/(main)/kalender/utils";

export interface CalendarSubscribePanelProps {
  teams: CalendarTeamInfo[];
  preselectedTeamLabel?: string;
  isOpen: boolean;
}

type Side = "all" | "home" | "away";

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
  const [showQR, setShowQR] = useState(false);

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
      className="mb-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      {/* Team selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Teams
        </label>
        <div className="flex flex-wrap gap-2">
          {teams
            .filter((t) => selectedTeamIds.has(t.id))
            .map((team) => (
              <span
                key={team.id}
                className="bg-kcvv-green-bright inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm text-white"
              >
                {team.label}
                <button
                  onClick={() => removeTeam(team.id)}
                  aria-label={`${team.label} ×`}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-xs hover:bg-white/20"
                >
                  ×
                </button>
              </span>
            ))}
          {unselectedTeams.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) addTeam(e.target.value);
                e.target.value = "";
              }}
              className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-600"
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
      </div>

      {/* Side filter */}
      <div>
        <label
          htmlFor="side-filter"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Filter
        </label>
        <select
          id="side-filter"
          value={side}
          onChange={(e) => setSide(e.target.value as Side)}
          aria-label="Filter"
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-auto"
        >
          <option value="all">Alle wedstrijden</option>
          <option value="home">Alleen thuiswedstrijden</option>
          <option value="away">Alleen uitwedstrijden</option>
        </select>
      </div>

      {/* URL display */}
      <div>
        <input
          type="text"
          readOnly
          value={webcalUrl}
          data-testid="webcal-url"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-600"
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {copied ? "Gekopieerd" : "Kopieer link"}
        </button>
        <button
          onClick={() => setShowQR((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {showQR ? "Verberg QR-code" : "Toon QR-code"}
        </button>
      </div>

      {/* QR code */}
      {showQR && (
        <div data-testid="qr-code" className="flex justify-center p-4">
          <QRCodeSVG value={webcalUrl} size={200} />
        </div>
      )}
    </div>
  );
}

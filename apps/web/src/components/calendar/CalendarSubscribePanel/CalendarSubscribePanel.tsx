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

function buildWebcalUrl(teamIds: number[], side: Side): string {
  return `webcal://kcvvelewijt.be/api/calendar.ics?teamIds=${teamIds.join(",")}&side=${side}`;
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

  const selectedPsdIds = teams
    .filter((t) => selectedTeamIds.has(t.id))
    .map((t) => t.psdId);

  const webcalUrl = buildWebcalUrl(selectedPsdIds, side);

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
    await navigator.clipboard.writeText(webcalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isOpen) return null;

  const unselectedTeams = teams.filter((t) => !selectedTeamIds.has(t.id));

  return (
    <div
      data-testid="subscribe-panel"
      className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-4"
    >
      {/* Team selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Teams
        </label>
        <div className="flex flex-wrap gap-2">
          {teams
            .filter((t) => selectedTeamIds.has(t.id))
            .map((team) => (
              <span
                key={team.id}
                className="inline-flex items-center gap-1 bg-kcvv-green-bright text-white text-sm px-3 py-1 rounded-full"
              >
                {team.label}
                <button
                  onClick={() => removeTeam(team.id)}
                  aria-label={`${team.label} ×`}
                  className="hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
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
              className="text-sm border border-gray-300 rounded-full px-3 py-1 text-gray-600"
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
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Filter
        </label>
        <select
          id="side-filter"
          value={side}
          onChange={(e) => setSide(e.target.value as Side)}
          aria-label="Filter"
          className="block w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 font-mono"
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {copied ? "Gekopieerd" : "Kopieer link"}
        </button>
        <button
          onClick={() => setShowQR((prev) => !prev)}
          className="inline-flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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

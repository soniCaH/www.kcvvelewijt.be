"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils/cn";
import { trackEvent } from "@/lib/analytics/track-event";
import { EmptyState, RemovableChip } from "@/components/design-system";
import {
  CALENDAR_EVENTS_PARAM,
  CALENDAR_EVENTS_PARAM_VALUE,
} from "@/lib/utils/calendar-feed-query";
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

/** `includeEvents` off omits the param entirely (rather than `events=0`), so
 * the URL stays byte-identical to the pre-#2704 matches-only feed. */
function buildWebcalUrl(
  teamIds: number[],
  side: Side,
  host: string,
  includeEvents: boolean,
): string {
  const base = `webcal://${host}/api/calendar.ics?teamIds=${teamIds.join(",")}&side=${side}`;
  return includeEvents
    ? `${base}&${CALENDAR_EVENTS_PARAM}=${CALENDAR_EVENTS_PARAM_VALUE}`
    : base;
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
  // On by default (#2705) — deliberately not the same as the route's own
  // default, which stays off (#2704).
  const [includeEvents, setIncludeEvents] = useState(true);
  // The URL a successful copy put on the clipboard — not a boolean. Comparing
  // it against the CURRENT `webcalUrl` below makes a stale confirmation
  // impossible by construction: change any selection (team/side/
  // includeEvents) and the comparison itself goes false, so there is nothing
  // to reset by hand (#2819, mirrors `failedUrl` below).
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  // The URL a failed copy described — not a boolean. Comparing it against the
  // CURRENT `webcalUrl` below makes a stale notice impossible by
  // construction: change any selection (team/side/includeEvents) and the
  // comparison itself goes false, so there is nothing to reset by hand.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  // The pending auto-clear timer, cancelled and replaced on every successful
  // copy. The value guard below only protects a confirmation for a DIFFERENT
  // url; copying the SAME url twice inside the window would otherwise let the
  // first attempt's timer clear the second attempt's confirmation early.
  const clearCopiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const host =
    typeof window !== "undefined"
      ? window.location.host
      : (process.env.NEXT_PUBLIC_HOST ?? "kcvvelewijt.be");

  const selectedPsdIds = teams
    .filter((t) => selectedTeamIds.has(t.id))
    .map((t) => t.psdId);

  const webcalUrl = buildWebcalUrl(selectedPsdIds, side, host, includeEvents);

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
      setCopiedUrl(webcalUrl);
      // Only clear the notice this attempt's own URL put up — an EARLIER,
      // now-stale attempt resolving after a LATER one already failed for a
      // different URL must not clear that later failure (#2580: two
      // overlapping copies can settle out of order).
      setFailedUrl((prev) => (prev === webcalUrl ? null : prev));
      // Auto-clear after the confirmation window. Two layers, because they
      // cover different races (#2819): cancel-and-replace gives every attempt
      // its own full window, so re-copying the SAME url does not inherit the
      // previous attempt's part-spent timer; the value guard then stops an
      // in-flight timer from clearing a confirmation for a DIFFERENT url.
      if (clearCopiedTimer.current) clearTimeout(clearCopiedTimer.current);
      clearCopiedTimer.current = setTimeout(
        () => setCopiedUrl((prev) => (prev === webcalUrl ? null : prev)),
        2000,
      );
      trackEvent("kalender_subscribe_copy", {
        teams_count: selectedPsdIds.length,
        side,
        events: includeEvents,
      });
    } catch (err) {
      // The caught error goes to the console only — the visitor sees the
      // locked Dutch copy below, never `err`'s own text (#2580 rule 6).
      console.error("Failed to copy to clipboard:", err);
      setFailedUrl(webcalUrl);
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

          {/* Club-activities on/off switch (#2705) — one control, all or
              nothing. Its own row, separate from the side-filter + copy row
              below so that row's equal-height lock (6d5) is untouched. */}
          <div
            className="mb-3 flex cursor-pointer items-center gap-2.5"
            onClick={() => setIncludeEvents((prev) => !prev)}
          >
            <button
              type="button"
              role="switch"
              aria-checked={includeEvents}
              aria-labelledby="subscribe-panel-events-label"
              className={cn(
                // 24×44px track — the WCAG 2.5.8 minimum target size (unlike
                // the smaller RemovableChip cross, which predates that check).
                "border-ink relative h-6 w-11 shrink-0 border-2 transition-colors",
                "focus-visible:outline-ink focus-visible:outline-2 focus-visible:outline-offset-2",
                includeEvents ? "bg-jersey-deep" : "bg-cream-soft",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "bg-ink absolute top-0.5 left-0.5 h-4 w-4 transition-transform motion-reduce:transition-none",
                  includeEvents ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
            <span
              id="subscribe-panel-events-label"
              className="text-ink font-mono text-[11px] font-semibold tracking-wide uppercase"
            >
              Clubactiviteiten
            </span>
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
                    "focus-visible:outline-ink focus-visible:outline-2 focus-visible:-outline-offset-2",
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
              className="border-ink bg-jersey-deep focus-visible:outline-ink border-2 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wide text-white uppercase shadow-[2px_2px_0_0_var(--color-ink)] transition-all duration-300 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0_0_var(--color-ink)]"
            >
              {copiedUrl === webcalUrl ? "Gekopieerd" : "Kopieer link"}
            </button>
          </div>

          {/* Tier 2, no action (#2470 resolution rule 7): the copy button
              above is its own retry, and the QR stub already carries the
              same URL. Direction-neutral copy ("om te abonneren", not
              "hiernaast"/"hierboven"): the stub sits beside the body at
              `sm+` but stacks above it below `sm`. */}
          {failedUrl === webcalUrl && (
            <EmptyState
              tier="slot"
              reason="unavailable"
              live
              emphasis={{ text: "mislukt" }}
              className="mt-3"
            >
              Kopiëren mislukt. Scan de QR-code om te abonneren.
            </EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}

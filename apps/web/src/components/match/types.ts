/**
 * Shared match domain types.
 * Imported by all match-domain components — keep this file free of
 * React / component dependencies so it can be used anywhere in the app.
 */

export type { MatchStatus } from "@kcvv/api-contract";

import type { MatchStatus } from "@kcvv/api-contract";

export interface ScheduleTeam {
  /** Team ID */
  id: number;
  /** Team name */
  name: string;
  /** Team logo URL */
  logo?: string;
}

export interface ScheduleMatch {
  /** Match ID */
  id: number;
  /** Match date */
  date: Date;
  /** Match time (HH:MM) */
  time?: string;
  /** Home team */
  homeTeam: ScheduleTeam;
  /** Away team */
  awayTeam: ScheduleTeam;
  /** Home team score (for finished matches) */
  homeScore?: number;
  /** Away team score (for finished matches) */
  awayScore?: number;
  /** Match status */
  status: MatchStatus;
  /** Competition name */
  competition?: string;
}

export interface UpcomingMatch {
  /** Match ID */
  id: number;
  /** Match date */
  date: Date;
  /** Match time (optional) */
  time?: string;
  /** Venue/location (optional) */
  venue?: string;
  /** Home team */
  homeTeam: {
    id: number;
    name: string;
    logo?: string;
    score?: number;
  };
  /** Away team */
  awayTeam: {
    id: number;
    name: string;
    logo?: string;
    score?: number;
  };
  /** Match status */
  status: MatchStatus;
  /** Squad label — identifies which KCVV team plays (e.g. "A-Ploeg", "U21") */
  squadLabel?: string;
  /** Competition name (optional) */
  competition?: string;
  /** PSD team ID identifying which KCVV team plays (A-team, U21, etc.) */
  kcvvTeamId?: number;
  /** Human-readable label for the KCVV team (e.g. "A-Ploeg", "U21") — from BFF */
  kcvvTeamLabel?: string;
  /** Optional team label for display — set by calling page (overrides kcvvTeamLabel) */
  teamLabel?: string;
}

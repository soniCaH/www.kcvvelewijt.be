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
  /** Whether the tracked team is playing at home. Provided by BFF via Match.is_home. */
  isHome?: boolean;
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
  /**
   * Front-end squad short code (e.g. "A-Ploeg", "U21") used for internal
   * identification of which KCVV squad is playing. Prefer `kcvvTeamLabel`
   * for display when available.
   */
  squadLabel?: string;
  /** Competition name (optional) */
  competition?: string;
  /** PSD team ID identifying which KCVV team plays (A-team, U21, etc.) */
  kcvvTeamId?: number;
  /**
   * Canonical human-readable label for the KCVV team (e.g. "A-Ploeg", "U21")
   * provided by the BFF via `kcvv_team_label`. Preferred for display over
   * `squadLabel`.
   */
  kcvvTeamLabel?: string;
  /**
   * Optional display-time team label set by the calling page. When present,
   * overrides `kcvvTeamLabel` for rendering.
   */
  teamLabel?: string;
}

/**
 * Shared match domain types.
 * Imported by all match-domain components — keep this file free of
 * React / component dependencies so it can be used anywhere in the app.
 */

export interface UpcomingMatch {
  /**
   * Match ID
   */
  id: number;
  /**
   * Match date
   */
  date: Date;
  /**
   * Match time (optional)
   */
  time?: string;
  /**
   * Venue/location (optional)
   */
  venue?: string;
  /**
   * Home team
   */
  homeTeam: {
    id: number;
    name: string;
    logo?: string;
    score?: number;
  };
  /**
   * Away team
   */
  awayTeam: {
    id: number;
    name: string;
    logo?: string;
    score?: number;
  };
  /**
   * Match status
   */
  status: "scheduled" | "finished" | "forfeited" | "postponed" | "stopped";
  /**
   * Round/matchday (optional)
   */
  round?: string;
  /**
   * Competition name (optional)
   */
  competition?: string;
  /** PSD team ID identifying which KCVV team plays (A-team, U21, etc.) */
  kcvvTeamId?: number;
  /** Human-readable label for the KCVV team (e.g. "A-Ploeg", "U21") — from BFF */
  kcvvTeamLabel?: string;
  /** Optional team label for display — set by calling page (overrides kcvvTeamLabel) */
  teamLabel?: string;
}

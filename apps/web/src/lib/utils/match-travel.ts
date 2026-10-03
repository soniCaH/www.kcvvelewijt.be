/**
 * The shared-element names of a fixture row growing into the match hero
 * (#3397). Plain module, no `"use client"`: `<MatchHero>` is a server
 * component and reads it too.
 *
 * The name carries the match id: a row pairs with the hero of its OWN match
 * only, so one match page leaving for another never pairs hero with hero.
 * `MATCH_TRAVEL_CLASS` is the `view-transition-class` both ends carry, which
 * `globals.css` styles (300 ms, the site's curve) without naming each match.
 */
export const MATCH_TRAVEL_CLASS = "match-travel";

export const matchTravelName = (matchId: number | string): string =>
  `match-card-${matchId}`;

import {
  RESERVEN_LABEL,
  RESERVEN_PSD_ID,
  type TeamLandingItem,
} from "@/lib/utils/group-teams";
import { teamDisplayName } from "@/lib/utils/team-display-name";

/**
 * Build a youth `TeamLandingItem` from an age code (e.g. "U13"). Pass a
 * `teamImageUrl` to exercise the squad-photo polaroid; omit it for the
 * `<JerseyShirt>` no-photo fallback. Shared by `<YouthDirectory>`'s stories
 * and unit tests so the fixture shape stays in one place.
 */
export const youthTeam = (
  age: string,
  teamImageUrl: string | null = null,
  overrides: Partial<TeamLandingItem> = {},
): TeamLandingItem => {
  const team = {
    _id: `t-${age}`,
    name: `KCVV Elewijt ${age}`,
    slug: `kcvv-elewijt-${age.toLowerCase()}`,
    age,
    psdId: null,
    division: null,
    divisionFull: null,
    tagline: null,
    teamImageUrl,
    staff: null,
    ...overrides,
  };
  // Resolved *after* the overrides, through the same helper the repository
  // uses (#2630) — `team` already carries any `displayName` override, so a
  // blank or whitespace-only one falls back to the slug-derived label exactly
  // as it would in production, and overriding `slug`/`name` moves the caption
  // with it. Assigning an override straight through would let a fixture render
  // a caption the real mapper can never produce.
  return { ...team, displayName: teamDisplayName(team) };
};

/**
 * The reserves — age "A" rather than an age code, so its slug resolves to the
 * plain name over an initialled jersey (#2414).
 *
 * `divisionFull` mirrors production, where Reserven is the only card in the
 * directory that has one — the other two teams with a division are the A and B
 * flagships, which never reach this component. That is the whole reason the
 * card's sub-line exists, so a fixture without it would show the slot only in
 * its empty state (#2641).
 */
export const reservenTeam = (): TeamLandingItem =>
  youthTeam("A", null, {
    _id: "t-reserven",
    name: RESERVEN_LABEL,
    slug: "reserven",
    psdId: RESERVEN_PSD_ID,
    divisionFull: "Reserven VV AH",
  });

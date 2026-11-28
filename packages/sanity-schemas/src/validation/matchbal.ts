import { isTakenElsewhere, type UniqueFieldContext } from "./unique-field";

/** Same shape as the web app's `parsePsdId`: an id it refuses would never show. */
const PSD_MATCH_ID = /^[1-9]\d{0,8}$/;

/**
 * Validation for `matchbal.matchId` (#3917): a numeric PSD match id, and one
 * Matchbal per Match. Empty passes: `.required()` stays the field's own call.
 */
export const validateMatchbalMatchId = async (
  value: unknown,
  context: UniqueFieldContext,
): Promise<true | string> => {
  if (typeof value !== "string" || value.length === 0) return true;

  if (!PSD_MATCH_ID.test(value)) {
    return "Gebruik het PSD-wedstrijd-id: enkel cijfers, zoals het in de link /wedstrijd/[matchId] staat (bijv. 3414).";
  }
  if (await isTakenElsewhere(context, "matchbal", "matchId", value)) {
    return `Wedstrijd ${value} heeft al een Matchbal. Elke wedstrijd heeft er maar één.`;
  }
  return true;
};

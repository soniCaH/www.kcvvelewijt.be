import { Schema as S } from "effect";

/**
 * Flexible date schema that accepts both ISO date strings and Date objects.
 * - Decoding: Accepts both string and Date, outputs Date; `""`, `"garbage"` and
 *   `new Date(NaN)` fail instead of decoding to an `Invalid Date`
 * - Encoding: Accepts Date, outputs ISO string
 */
export const DateFromStringOrDate = S.Union(S.Date, S.ValidDateFromSelf);

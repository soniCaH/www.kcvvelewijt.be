export type TransferDirection = "incoming" | "outgoing" | "extension";

/**
 * Normalised client-side shape of a `transferFact` body block. Raw Sanity
 * image fields (`otherClubLogo`) are replaced with a CDN-projected URL
 * by the `ARTICLE_BY_SLUG_QUERY` GROQ projection; text fields come
 * through untouched via the body `...` spread.
 *
 * The hero portrait is sourced from `article.coverImage` (same hotspot
 * crop the interview template uses) — `transferFact` no longer carries
 * its own player photo.
 */
export interface TransferFactValue {
  _key?: string;
  _type?: "transferFact";
  direction?: TransferDirection;
  playerName?: string;
  position?: string;
  age?: number;
  otherClubName?: string;
  otherClubLogoUrl?: string | null;
  /** Short context line beneath the other club on the van/naar strip. */
  otherClubContext?: string;
  /** Short context line beneath the KCVV row on the strip. */
  kcvvContext?: string;
  /** Only rendered when `direction === "extension"`. */
  until?: string;
  note?: string;
  /** Optional override for the pull-quote byline; defaults to `playerName`. */
  noteAttribution?: string;
}

/**
 * One of the two clubs displayed in a from/to row. `isKcvv` drives the
 * auto-render (fixed club name + static logo asset) and the green
 * 2 px accent bar on the feature variant.
 */
export interface TransferSide {
  name: string;
  logoUrl: string | null;
  isKcvv: boolean;
}

/**
 * Result of resolving a `transferFact` to renderable rows. Discriminated
 * by `kind` so call sites can rely on the compiler to enforce which
 * fields are populated — no `!` assertions on `from`/`to` needed.
 *
 * - `kind === "pair"`: incoming or outgoing — both `from` and `to` are
 *   guaranteed present.
 * - `kind === "extension"`: single KCVV row + optional `until` label.
 *
 * Design §5.3 / §8.1 — `kickerLabel` is a small-caps typographic token
 * in Dutch: `Inkomend` / `Uitgaand` / `Verlengd`. CSS `uppercase` handles
 * the small-caps rendering.
 */
export type ResolvedTransfer =
  | {
      kind: "pair";
      direction: Exclude<TransferDirection, "extension">;
      kickerLabel: string;
      from: TransferSide;
      to: TransferSide;
    }
  | {
      kind: "extension";
      direction: "extension";
      kickerLabel: string;
      kcvvOnly: TransferSide;
      until?: string;
    };

export const KCVV_CLUB_NAME = "KCVV Elewijt";
export const KCVV_CLUB_LOGO_URL = "/images/logos/kcvv-logo.png";

const KCVV_SIDE: TransferSide = {
  name: KCVV_CLUB_NAME,
  logoUrl: KCVV_CLUB_LOGO_URL,
  isKcvv: true,
};

/**
 * Map a raw `transferFact` value to the two (or one) rendered sides. The
 * editor never fills in the KCVV side — direction decides which row is
 * auto-populated.
 *
 * `direction` is schema-required, but GROQ drafts/previews can surface a
 * value without it. Fall back to `incoming` and surface a console warning
 * in non-production so editors notice the gap in Studio previews.
 */
export function resolveTransfer(value: TransferFactValue): ResolvedTransfer {
  const direction = value.direction ?? "incoming";
  if (!value.direction && process.env.NODE_ENV !== "production") {
    console.warn(
      "[transferFact] direction missing — defaulting to 'incoming'",
      { _key: value._key, playerName: value.playerName },
    );
  }

  if (direction === "extension") {
    return {
      kind: "extension",
      direction,
      kickerLabel: "Verlengd",
      kcvvOnly: KCVV_SIDE,
      until: value.until,
    };
  }

  // Non-extension directions require an other-club name; the schema marks
  // this via conditional `hidden` rules + field-level validation, but
  // drafts + Studio preview can surface partial data. Surface it so the
  // gap is obvious rather than rendering a blank club pill.
  if (!value.otherClubName && process.env.NODE_ENV !== "production") {
    console.warn(
      "[transferFact] otherClubName missing on non-extension direction — rendering a blank club row",
      { _key: value._key, playerName: value.playerName, direction },
    );
  }

  const otherSide: TransferSide = {
    name: value.otherClubName ?? "",
    logoUrl: value.otherClubLogoUrl ?? null,
    isKcvv: false,
  };

  if (direction === "outgoing") {
    return {
      kind: "pair",
      direction,
      kickerLabel: "Uitgaand",
      from: KCVV_SIDE,
      to: otherSide,
    };
  }

  // incoming (default branch — covers explicit "incoming" + the missing-
  // direction fallback warned about above)
  return {
    kind: "pair",
    direction: "incoming",
    kickerLabel: "Inkomend",
    from: otherSide,
    to: KCVV_SIDE,
  };
}

export type TransferDirection = "incoming" | "outgoing" | "extension";

/**
 * Normalised client-side shape of a `transferFact` body block. The raw
 * Sanity image fields (`playerPhoto`, `otherClubLogo`) are replaced with
 * CDN-projected URLs by the `ARTICLE_BY_SLUG_QUERY` GROQ projection.
 */
export interface TransferFactValue {
  _key?: string;
  _type?: "transferFact";
  direction?: TransferDirection;
  playerName?: string;
  playerPhotoUrl?: string | null;
  position?: string;
  age?: number;
  otherClubName?: string;
  otherClubLogoUrl?: string | null;
  /** Only rendered when `direction === "extension"`. */
  until?: string;
  note?: string;
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
 * Result of resolving a `transferFact` to renderable rows. Extensions
 * collapse to a single KCVV row plus an `until` label, so `from`/`to`
 * stay undefined.
 */
export interface ResolvedTransfer {
  direction: TransferDirection;
  /**
   * Design §5.3 / §8.1 — small-caps typographic label. Locked English on
   * the design side (INCOMING / OUTGOING / EXTENSION as typographic
   * tokens, not translatable UI copy).
   */
  kickerLabel: string;
  from?: TransferSide;
  to?: TransferSide;
  kcvvOnly?: TransferSide;
  until?: string;
}

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
  const otherSide: TransferSide = {
    name: value.otherClubName ?? "",
    logoUrl: value.otherClubLogoUrl ?? null,
    isKcvv: false,
  };

  if (direction === "extension") {
    return {
      direction,
      kickerLabel: "Extension",
      kcvvOnly: KCVV_SIDE,
      until: value.until,
    };
  }

  if (direction === "outgoing") {
    return {
      direction,
      kickerLabel: "Outgoing",
      from: KCVV_SIDE,
      to: otherSide,
    };
  }

  // incoming (default)
  return {
    direction,
    kickerLabel: "Incoming",
    from: otherSide,
    to: KCVV_SIDE,
  };
}

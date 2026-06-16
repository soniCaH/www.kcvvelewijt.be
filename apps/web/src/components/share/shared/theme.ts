import { KCVV_LOGO, TOKENS } from "../constants";

/**
 * Voice register for a share card (locked design `sh4`):
 * - `cream` — register A, the calm/sober cream sheet.
 * - `dark`  — register B, the loud jersey-deep poster.
 * - `image` — fullscreen newsprint photo + gradient overlay (cream text).
 */
export type ShareRegister = "cream" | "dark" | "image";

/**
 * Sentiment carried by the accent colour. Only register A reacts to sentiment
 * (positive → jersey, negative → brick); the dark/image registers are always
 * warm because they are reserved for loud KCVV-positive moments.
 */
export type ShareSentiment = "neutral" | "positive" | "negative";

/** Overlay strength for the fullscreen-image register. */
export type ShareOverlay = "calm" | "shout";

/** Resolved foreground palette consumed by the share sub-components. */
export interface SharePalette {
  /** Base text colour (crest, handle, footer, names, body). */
  text: string;
  /** Muted/secondary text colour. */
  muted: string;
  /** Mono kicker colour. */
  kicker: string;
  /** Headline emphasis (italic accent word). */
  emphasis: string;
  /** Headline punctuation (warm `!` / sober `.` / brick `.`). */
  punct: string;
  /** Big score colour. */
  scoreline: string;
  /** Shirt-number disc background + text. */
  numDiscBg: string;
  numDiscText: string;
  /** Low-opacity colour for decorative ghost numerals/letters. */
  ghost: string;
  /** Hairline rule colour appropriate to the register. */
  rule: string;
}

/** Darker than `--color-ink-muted` so small mono text clears AA on cream. */
const CREAM_MUTED = "#525252";
const CREAM_GHOST = "rgba(245, 241, 230, 0.08)";
const JERSEY_GHOST = "rgba(0, 135, 85, 0.07)";
const BRICK_GHOST = "rgba(201, 63, 28, 0.08)";

/** Foreground palette shared by the dark (B) and fullscreen-image registers. */
const LOUD_PALETTE: SharePalette = {
  text: TOKENS.cream,
  // Strong enough to stay legible at small Story sizes on a phone.
  muted: "rgba(245, 241, 230, 0.82)",
  kicker: TOKENS.warm,
  emphasis: TOKENS.warm,
  punct: TOKENS.warm,
  scoreline: TOKENS.cream,
  numDiscBg: TOKENS.warm,
  numDiscText: TOKENS.ink,
  ghost: CREAM_GHOST,
  rule: "rgba(245, 241, 230, 0.18)",
};

/**
 * Resolve the foreground palette for a register + sentiment combination,
 * mirroring the `.vA / .vB / .fs` colour cascade in the locked `sh4` mockup.
 */
export function resolvePalette(
  register: ShareRegister,
  sentiment: ShareSentiment = "neutral",
): SharePalette {
  if (register === "dark" || register === "image") {
    return LOUD_PALETTE;
  }

  // Register A (cream sheet) — sentiment drives the accent.
  if (sentiment === "negative") {
    return {
      text: TOKENS.ink,
      muted: CREAM_MUTED,
      kicker: TOKENS.brick,
      emphasis: TOKENS.inkSoft,
      punct: TOKENS.brick,
      scoreline: TOKENS.ink,
      numDiscBg: TOKENS.brick,
      numDiscText: TOKENS.cream,
      ghost: BRICK_GHOST,
      rule: "rgba(10, 10, 10, 0.14)",
    };
  }

  const punct = sentiment === "positive" ? TOKENS.jerseyDeep : TOKENS.warm;
  return {
    text: TOKENS.ink,
    muted: TOKENS.inkMuted,
    kicker: TOKENS.jerseyDeep,
    emphasis: TOKENS.jerseyDeep,
    punct,
    scoreline: TOKENS.ink,
    numDiscBg: TOKENS.jerseyDeep,
    numDiscText: TOKENS.cream,
    ghost: JERSEY_GHOST,
    rule: "rgba(10, 10, 10, 0.14)",
  };
}

/** Gradient overlay applied over a fullscreen newsprint photo. */
export function overlayGradient(overlay: ShareOverlay): string {
  return overlay === "shout"
    ? "linear-gradient(180deg, rgba(10,30,20,0.55) 0%, rgba(19,61,40,0.30) 42%, rgba(8,26,18,0.92) 100%)"
    : "linear-gradient(180deg, rgba(10,30,20,0.40) 0%, rgba(19,61,40,0.20) 38%, rgba(8,26,18,0.86) 100%)";
}

/** Split a "Home — Away" match name into its two club names. */
export function splitMatchName(matchName: string): {
  home: string;
  away: string;
} {
  const parts = matchName.split(/—|\s-\s/).map((s) => s.trim());
  return { home: parts[0] ?? matchName, away: parts[1] ?? "" };
}

/** Best-effort opponent name: the side that is not KCVV. */
export function opponentName(matchName: string): string {
  const { home, away } = splitMatchName(matchName);
  if (/kcvv/i.test(home) && !/kcvv/i.test(away)) return away;
  if (/kcvv/i.test(away) && !/kcvv/i.test(home)) return home;
  return away || home;
}

export type ResultMood = "win" | "draw" | "loss";

export interface ResolvedResultMood {
  register: ShareRegister;
  sentiment: ShareSentiment;
  headline: string;
  punctuation: "bang" | "dot";
  /** Overlay strength when the result template carries a fullscreen photo. */
  overlay: ShareOverlay;
}

/**
 * Map a match result to its register, sentiment, headline, punctuation and
 * image overlay: win → loud register B with a warm bang + shout overlay;
 * draw → calm cream; loss → sober brick. Shared by the Eindstand (9:16) and
 * Square result templates.
 */
export function resolveResultMood(mood: ResultMood): ResolvedResultMood {
  switch (mood) {
    case "win":
      return {
        register: "dark",
        sentiment: "neutral",
        headline: "Gewonnen",
        punctuation: "bang",
        overlay: "shout",
      };
    case "draw":
      return {
        register: "cream",
        sentiment: "neutral",
        headline: "Gelijkspel",
        punctuation: "dot",
        overlay: "calm",
      };
    case "loss":
      return {
        register: "cream",
        sentiment: "negative",
        headline: "Verloren",
        punctuation: "dot",
        overlay: "calm",
      };
  }
}

/** Normalize a "2 - 0" score to a tight en-dash "2–0" for display. */
export function formatScore(score: string): string {
  return score.replace(/\s*-\s*/g, "–");
}

export interface CrestEntry {
  logo: string;
  alt: string;
  rotate: number;
}

/**
 * Resolve the crest matchup for a match. KCVV's own side always uses the crisp
 * local crest; the opponent uses the crest supplied from the match data (absent
 * on free-typed matches, so that tile is simply omitted).
 */
export function resolveCrests(
  matchName: string,
  homeLogo?: string,
  awayLogo?: string,
): CrestEntry[] {
  const { home, away } = splitMatchName(matchName);
  const homeCrest = /kcvv/i.test(home) ? KCVV_LOGO : homeLogo;
  const awayCrest = /kcvv/i.test(away) ? KCVV_LOGO : awayLogo;
  const entries: (CrestEntry | null)[] = [
    homeCrest ? { logo: homeCrest, alt: home, rotate: -3 } : null,
    away && awayCrest ? { logo: awayCrest, alt: away, rotate: 3 } : null,
  ];
  return entries.filter((c): c is CrestEntry => Boolean(c));
}

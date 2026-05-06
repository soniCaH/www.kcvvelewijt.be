/**
 * <TransferFactStrip> — Phase 3 §5.B.2 / `transfer-locked.md`.
 *
 * Renders the per-direction strip beneath the EditorialHero on
 * `articleType="transfer"` articles. Internally branches on
 * `transferFact.direction`:
 *
 *  - **incoming**  →  [other-club] →  [player] →  [KCVV]   (jersey-deep arrows)
 *  - **outgoing**  →  [KCVV]       →  [player] →  [other-club]  (alert-red arrows)
 *  - **extension** →                  [player]                  (no arrows; "tot {until}" stamp)
 *
 * Layout: viewport-responsive (`md:` breakpoint at 768px). Below that
 * the strip flips vertical with an SVG down-arrow. The `orientation`
 * prop forces vertical regardless of viewport — used by Storybook
 * fixtures to preview the narrow rendering without a viewport addon.
 */
import { TapedCard } from "@/components/design-system/TapedCard";
import { MonoStar } from "@/components/design-system/MonoStar";
import {
  KCVV_CLUB_LOGO_URL,
  KCVV_CLUB_NAME,
  type TransferFactValue,
  type TransferSide,
  resolveTransfer,
} from "../TransferFact/types";

export type TransferFactStripOrientation = "auto" | "vertical";

interface TransferFactStripProps {
  value: TransferFactValue;
  /**
   * `auto` (default): viewport-responsive (vertical < 768px, horizontal ≥ 768px).
   * `vertical`: force vertical layout regardless of viewport. Used by
   * Storybook fixtures to preview the narrow rendering.
   */
  orientation?: TransferFactStripOrientation;
}

function ClubShield({ side }: { side: TransferSide }) {
  if (side.logoUrl) {
    // Plain <img> — opponent shield URLs come from arbitrary hosts
    // (Sanity-cached or placeholder for storybook fixtures); next/image's
    // remote-host allowlist would reject them.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={side.logoUrl}
        alt={side.name}
        width={80}
        height={80}
        className="h-16 w-16 object-contain"
      />
    );
  }
  // Text fallback — single-letter monogram in jersey-deep ink.
  const initial = side.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-label={side.name}
      className="text-jersey-deep flex h-16 w-16 items-center justify-center font-serif text-4xl leading-none font-black italic"
    >
      {initial}
    </span>
  );
}

function ClubCard({
  side,
  role,
  contextLine,
  rotation,
}: {
  side: TransferSide;
  role: string;
  contextLine?: string;
  rotation: number;
}) {
  return (
    <TapedCard
      rotation={rotation}
      tape={[{ color: "jersey", length: "md" }]}
      bg="cream"
      padding="lg"
      className="w-[260px] text-center"
    >
      <div className="flex flex-col items-center gap-3">
        <ClubShield side={side} />
        <span className="text-jersey-deep font-mono text-[length:var(--text-label)] leading-none font-bold tracking-[var(--text-label--tracking)] uppercase">
          {role}
        </span>
        <p className="font-serif text-xl leading-tight font-black italic">
          {side.name}
        </p>
        {contextLine !== undefined && contextLine.trim() !== "" ? (
          <span className="text-ink-muted font-mono text-[length:var(--text-label)] leading-none tracking-[var(--text-label--tracking)] uppercase">
            {contextLine}
          </span>
        ) : null}
      </div>
    </TapedCard>
  );
}

function PlayerCard({
  playerName,
  position,
  age,
  extensionUntil,
  rotation,
}: {
  playerName: string;
  position?: string;
  age?: number;
  extensionUntil?: string;
  rotation: number;
}) {
  const meta = [position, age !== undefined ? `${age} j.` : null]
    .filter((v): v is string => Boolean(v))
    .join(" · ");
  const isExtension = extensionUntil !== undefined;
  return (
    <TapedCard
      rotation={rotation}
      tape={[{ color: "ink", length: "md" }]}
      bg="cream-soft"
      padding="lg"
      className={`text-center ${isExtension ? "w-[440px]" : "w-[360px]"}`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="text-ink-muted flex items-center gap-2 font-mono text-xs leading-none uppercase">
          <MonoStar />
          <span>{isExtension ? "Verlengd" : "Speler"}</span>
          <MonoStar />
        </div>
        <p className="font-serif text-3xl leading-tight font-black italic">
          {playerName}
        </p>
        {meta !== "" ? (
          <span className="text-ink-muted font-mono text-[length:var(--text-label)] leading-none tracking-[var(--text-label--tracking)] uppercase">
            {meta}
          </span>
        ) : null}
        {isExtension ? (
          <span
            className="border-jersey-deep text-jersey-deep bg-cream-soft mt-2 inline-block -rotate-1 border px-4 py-2 font-mono text-sm font-bold uppercase"
            aria-label={`Verlengd tot ${extensionUntil}`}
          >
            tot {extensionUntil}
          </span>
        ) : null}
      </div>
      {!isExtension ? (
        <div
          aria-hidden="true"
          className="border-paper-edge -mx-5 mt-5 border-t border-dashed pt-0"
        />
      ) : null}
    </TapedCard>
  );
}

function Arrow({
  tone,
  forceVertical,
}: {
  tone: "jersey-deep" | "alert";
  forceVertical: boolean;
}) {
  const colorClass = tone === "alert" ? "text-alert" : "text-jersey-deep";
  // Wide-only horizontal arrow. Hidden when `forceVertical` is on; otherwise
  // shows on `md` and up.
  const wideClasses = forceVertical
    ? "hidden"
    : "hidden shrink-0 items-center justify-center md:flex";
  // Narrow-only vertical arrow. Always visible when `forceVertical`; otherwise
  // shows below `md`.
  const narrowClasses = forceVertical
    ? "flex shrink-0 items-center justify-center"
    : "flex shrink-0 items-center justify-center md:hidden";
  return (
    <>
      <div aria-hidden="true" className={`${wideClasses} ${colorClass}`}>
        <span className="font-serif text-6xl leading-none italic">→</span>
      </div>
      <div aria-hidden="true" className={`${narrowClasses} ${colorClass}`}>
        <svg
          viewBox="0 0 28 38"
          className="h-9 w-7"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 4 L14 32 M5 23 L14 33 L23 23" />
        </svg>
      </div>
    </>
  );
}

export function TransferFactStrip({
  value,
  orientation = "auto",
}: TransferFactStripProps) {
  const resolved = resolveTransfer(value);
  const forceVertical = orientation === "vertical";

  if (resolved.kind === "extension") {
    return (
      <div className="flex justify-center py-12">
        <PlayerCard
          playerName={value.playerName ?? ""}
          position={value.position}
          age={value.age}
          extensionUntil={value.until ?? "—"}
          rotation={0.6}
        />
      </div>
    );
  }

  const arrowTone = resolved.direction === "outgoing" ? "alert" : "jersey-deep";

  // Decide which side gets the player-card centerpiece. Player card always
  // renders in the middle; the editor-supplied other-club + KCVV cards
  // flank it according to direction.
  const fromIsKcvv = resolved.from.isKcvv;
  const otherSide = fromIsKcvv ? resolved.to : resolved.from;
  const otherRole = resolved.direction === "incoming" ? "Van" : "Naar";
  const kcvvRole = resolved.direction === "incoming" ? "Naar" : "Van";

  const containerClasses = forceVertical
    ? "flex flex-col items-center justify-center gap-6 py-10"
    : "flex flex-col items-center justify-center gap-6 py-10 md:flex-row md:gap-4";

  return (
    <div className={containerClasses}>
      <ClubCard
        side={otherSide}
        role={otherRole}
        contextLine={value.otherClubContext}
        rotation={-1.2}
      />
      <Arrow tone={arrowTone} forceVertical={forceVertical} />
      <PlayerCard
        playerName={value.playerName ?? ""}
        position={value.position}
        age={value.age}
        rotation={0.6}
      />
      <Arrow tone={arrowTone} forceVertical={forceVertical} />
      <ClubCard
        side={{
          name: KCVV_CLUB_NAME,
          logoUrl: KCVV_CLUB_LOGO_URL,
          isKcvv: true,
        }}
        role={kcvvRole}
        contextLine={value.kcvvContext}
        rotation={1.2}
      />
    </div>
  );
}

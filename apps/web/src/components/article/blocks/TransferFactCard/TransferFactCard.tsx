import type { ReactNode } from "react";
import Image from "next/image";
import { TapedCard, type TapeStripProps } from "@/components/design-system";
import {
  resolveTransfer,
  type TransferDirection,
  type TransferFactValue,
} from "../TransferFact/types";
import { cn } from "@/lib/utils/cn";

/**
 * <TransferFactCard> — compact body-level renderer for additional
 * `transferFact` PT blocks beyond the first (the first powers the hero
 * via `<TransferFactStrip>`, Phase 3-b R1.5).
 *
 * Per the 5.d-tra lock (updated post-#1797 design call): an outer
 * `<TapedCard>` with a single top `<TapeStrip>` colour-coded by direction
 * (jersey = incoming/extension, warm = outgoing), a mono caps direction
 * chip, the player name in italic Freight Display 900, a mono caps
 * position/age line, and a direction-dependent "from → to" line in
 * italic serif — with the `otherClubLogoUrl` rendered as a 12px inline
 * crest preceding the other-club name when available.
 *
 * Card is non-interactive (no link wrapper) — the transferFact block is
 * content, not a navigation target.
 *
 * Adjacency-aware grouping (consecutive transferFacts → 2-up grid,
 * isolated → 1-up at prose width) is owned by `<TransferFactGroup>` in
 * `<ArticleBody>` so the card itself stays agnostic to layout context.
 */

const ROTATION_POOL = ["a", "b", "c", "d"] as const;
type CardRotation = (typeof ROTATION_POOL)[number];

// djb2-light deterministic hash — same shape as the NewsCard helper.
function hashIndex(seed: string, modulo: number): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i += 1) {
    h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  }
  return h % modulo;
}

function deriveRotation(seed: string): CardRotation {
  return ROTATION_POOL[hashIndex(seed, ROTATION_POOL.length)]!;
}

const DIRECTION_CHIP: Record<
  TransferDirection,
  { label: string; glyph: string }
> = {
  incoming: { label: "IN", glyph: "↓" },
  outgoing: { label: "OUT", glyph: "↑" },
  extension: { label: "VERLENGING", glyph: "↻" },
};

const TAPE_COLOR: Record<TransferDirection, TapeStripProps["color"]> = {
  incoming: "jersey-deep",
  extension: "jersey-deep",
  outgoing: "warm",
};

function renderRouteLine(
  fact: TransferFactValue,
  direction: TransferDirection,
): ReactNode {
  const otherClub = fact.otherClubName?.trim() ?? "";
  const kcvv = fact.kcvvContext?.trim();
  const until = fact.until?.trim();
  const kcvvSuffix = kcvv ? ` · ${kcvv}` : "";
  const logoUrl = fact.otherClubLogoUrl?.trim() || null;

  if (direction === "extension") {
    return `A-kern${kcvvSuffix}${until ? ` · tot ${until}` : ""}`;
  }

  const inlineLogo = logoUrl ? (
    <Image
      src={logoUrl}
      alt=""
      aria-hidden="true"
      width={12}
      height={12}
      className="mr-1 inline-block h-[12px] w-[12px] object-contain align-[-1px]"
      data-transfer-fact-inline-logo="true"
    />
  ) : null;

  if (direction === "incoming") {
    return (
      <>
        {inlineLogo}
        {`${otherClub} → KCVV${kcvvSuffix}`}
      </>
    );
  }

  // outgoing — KCVV → {logo}otherClub
  return (
    <>
      {`KCVV${kcvvSuffix} → `}
      {inlineLogo}
      {otherClub}
    </>
  );
}

export interface TransferFactCardProps {
  fact: TransferFactValue;
  className?: string;
}

export function TransferFactCard({ fact, className }: TransferFactCardProps) {
  const resolved = resolveTransfer(fact);
  const direction = resolved.direction;
  const chip = DIRECTION_CHIP[direction];
  const rotation = deriveRotation(
    fact.playerName ?? fact._key ?? `${direction}-${fact.age ?? ""}`,
  );
  const tapeColor = TAPE_COLOR[direction];

  const playerName = fact.playerName?.trim() ?? "";
  const position = fact.position?.trim() ?? "";
  const ageLabel =
    typeof fact.age === "number" && fact.age > 0 ? `${fact.age} jaar` : "";
  const contextParts = [position, ageLabel].filter((p) => p.length > 0);
  const route = renderRouteLine(fact, direction);

  return (
    <TapedCard
      bg="cream"
      rotation={rotation}
      tape={[{ color: tapeColor, length: "md" }]}
      padding="md"
      className={cn(className)}
    >
      <article
        data-transfer-fact-card="true"
        data-direction={direction}
        className="flex flex-col gap-2"
      >
        <span
          data-transfer-fact-chip="true"
          className="border-ink text-ink inline-flex w-fit items-center gap-1.5 border px-2 py-1 font-mono text-[10px] leading-none font-semibold tracking-[0.1em] uppercase"
        >
          <span>{chip.label}</span>
          <span aria-hidden="true">{chip.glyph}</span>
        </span>
        <h3
          data-transfer-fact-name="true"
          className="font-display text-ink text-[16px] leading-tight font-black italic"
        >
          {playerName}
        </h3>
        {contextParts.length > 0 ? (
          <p
            data-transfer-fact-context="true"
            className="text-ink-muted m-0 font-mono text-[9px] leading-none tracking-[0.18em] uppercase"
          >
            {contextParts.join(" · ")}
          </p>
        ) : null}
        <p
          data-transfer-fact-route="true"
          className="text-ink m-0 font-serif text-[13px] leading-snug italic"
        >
          {route}
        </p>
      </article>
    </TapedCard>
  );
}

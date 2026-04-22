import Image from "next/image";
import { ArrowRight } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";
import {
  resolveTransfer,
  type TransferFactValue,
  type TransferSide,
} from "@/components/article/blocks/TransferFact";

export interface TransferStripProps {
  feature: TransferFactValue;
  className?: string;
}

/**
 * Design §5.3 — horizontal transfer strip. Renders beneath the §7.6
 * metadata bar and describes the move at display scale:
 *
 *   VAN                       [ → ]            NAAR
 *   Standard Luik  (logo)    INKOMEND          KCVV Elewijt  (logo)
 *   Jupiler Pro League · U23                   Derde Amateur · A-ploeg · #8
 *
 * Colour + arrow rules:
 *   - `incoming`  → `ArrowRight` in `kcvv-green-bright`, label `INKOMEND`.
 *   - `outgoing`  → `ArrowRight` in `kcvv-warning` (amber), label `UITGAAND`.
 *                   Same warm #ffae00 already in the semantic palette — the
 *                   departure is acknowledged but not alarmed (no red pill).
 *   - `extension` → NO arrow at all. Single centered KCVV block with a
 *                   `VERLENGD` label in `kcvv-green-dark` and `TOT {until}`
 *                   beneath. The absence of direction is the signal.
 */
export const TransferStrip = ({ feature, className }: TransferStripProps) => {
  const resolved = resolveTransfer(feature);

  if (resolved.kind === "extension") {
    return (
      <section
        data-testid="transfer-strip"
        data-direction="extension"
        className={cn(
          // Break out of the 70 rem body column — on a 1440 px+ screen
          // the strip needs wider canvas than the reading width.
          "full-bleed py-10",
          className,
        )}
      >
        <div className="mx-auto flex max-w-outer flex-col items-center gap-3 px-6 text-center">
          <p
            className="text-xs font-semibold uppercase tracking-[var(--letter-spacing-label)] text-kcvv-green-dark"
            data-testid="transfer-strip-label"
          >
            {resolved.kickerLabel}
          </p>
          <ClubBlock
            side={resolved.kcvvOnly}
            context={feature.kcvvContext}
            align="center"
          />
          {resolved.until && (
            <p
              data-testid="transfer-strip-until"
              className="mt-2 font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray"
            >
              tot {resolved.until}
            </p>
          )}
        </div>
      </section>
    );
  }

  const isOutgoing = resolved.direction === "outgoing";
  const arrowClass = isOutgoing
    ? "text-kcvv-warning"
    : "text-kcvv-green-bright";
  const labelClass = isOutgoing ? "text-kcvv-warning" : "text-kcvv-green-dark";

  const fromContext = resolved.from.isKcvv
    ? feature.kcvvContext
    : feature.otherClubContext;
  const toContext = resolved.to.isKcvv
    ? feature.kcvvContext
    : feature.otherClubContext;

  return (
    <section
      data-testid="transfer-strip"
      data-direction={resolved.direction}
      className={cn(
        // Break out of the 70 rem body column for breathing room on
        // wide desktops; the horizontal van → naar composition needs
        // the canvas to read comfortably.
        "full-bleed py-10",
        className,
      )}
    >
      <div className="mx-auto grid max-w-outer grid-cols-[1fr_auto_1fr] items-center gap-x-10 gap-y-4 px-6 md:gap-x-16">
        <div className="text-right">
          <p className="mb-2 font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray">
            Van
          </p>
          <div className="flex justify-end">
            <ClubBlock
              side={resolved.from}
              context={fromContext}
              align="right"
            />
          </div>
        </div>

        <div
          className="flex flex-col items-center gap-2"
          data-testid="transfer-strip-middle"
        >
          <ArrowRight
            aria-hidden="true"
            className={cn("h-6 w-6", arrowClass)}
            data-testid="transfer-strip-arrow"
          />
          <p
            className={cn(
              "font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)]",
              labelClass,
            )}
            data-testid="transfer-strip-label"
          >
            {resolved.kickerLabel}
          </p>
        </div>

        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray">
            Naar
          </p>
          <ClubBlock side={resolved.to} context={toContext} />
        </div>
      </div>
    </section>
  );
};

interface ClubBlockProps {
  side: TransferSide;
  context?: string;
  align?: "left" | "right" | "center";
}

function ClubBlock({ side, context, align = "left" }: ClubBlockProps) {
  const alignmentClass =
    align === "right"
      ? "items-end text-right"
      : align === "center"
        ? "items-center text-center"
        : "items-start text-left";
  return (
    <div className={cn("flex flex-col", alignmentClass)}>
      <div
        className={cn(
          "flex items-center gap-3",
          align === "right" && "flex-row-reverse",
        )}
      >
        {side.logoUrl && (
          <Image
            src={side.logoUrl}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
        )}
        <span
          className={cn(
            "font-title font-bold text-2xl",
            side.isKcvv ? "text-kcvv-green-dark" : "text-kcvv-gray-blue",
          )}
        >
          {side.name}
        </span>
      </div>
      {context && (
        <p className="mt-1 font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray">
          {context}
        </p>
      )}
    </div>
  );
}

import Image from "next/image";
import { ArrowRight } from "@/lib/icons";
import { Icon } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import { resolveTransfer, type TransferFactValue } from "./types";

export interface TransferFactOverviewProps {
  value: TransferFactValue;
  className?: string;
}

/**
 * Design §8.1 — overview variant of a `transferFact` block. Rendered for
 * subsequent transferFact blocks in a transfer article (the first one is
 * absorbed by the hero + strip), or inline inside an announcement.
 *
 * Horizontal row on a full-bleed dark band. Four slots on md+:
 *
 *   [kicker]   [player + meta]   [clubs inline]   [status]
 *
 * Consecutive transferFact rows stack into one continuous dark section
 * with subtle white-alpha rules between them — mirrors the editorial
 * "moment" treatment the interview qaBlock cream bands use, inverted.
 *
 * Colour rules per direction:
 *   - `incoming`  kicker + arrow = `kcvv-green-bright` (pops on dark).
 *   - `outgoing`  kicker + arrow = `kcvv-warning` (amber — reported, not
 *     alarmed).
 *   - `extension` kicker = `kcvv-green-bright`. No arrow — single KCVV
 *     row + `TOT {until}` status label on the right.
 */
export const TransferFactOverview = ({
  value,
  className,
}: TransferFactOverviewProps) => {
  const resolved = resolveTransfer(value);
  const { playerName, age, position } = value;

  const metaParts = [
    typeof age === "number" ? String(age) : null,
    position,
  ].filter((x): x is string => typeof x === "string" && x.length > 0);

  const isOutgoing = resolved.direction === "outgoing";
  const accentClass = isOutgoing
    ? "text-kcvv-warning"
    : "text-kcvv-green-bright";
  const accentBgClass = isOutgoing ? "bg-kcvv-warning" : "bg-kcvv-green-bright";

  const statusLabel =
    resolved.kind === "extension"
      ? resolved.until
        ? `tot ${resolved.until}`
        : "verlengd"
      : "transfer";

  return (
    <section
      data-testid="transfer-overview"
      data-direction={resolved.direction}
      className={cn(
        // Break out of the 65 ch prose column so consecutive rows share
        // one continuous dark band. Each row uses the same `max-w-outer`
        // inner container, so the column grid aligns row-to-row.
        "full-bleed not-prose bg-kcvv-gray-dark py-6",
        // White-alpha top rule separates stacked rows without shouting.
        "border-t border-kcvv-white/10",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto grid max-w-outer px-6",
          "gap-x-6 gap-y-3",
          "md:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-center md:gap-x-8",
        )}
      >
        <div
          data-testid="transfer-overview-kicker"
          className={cn(
            "flex items-center gap-2 text-xs font-semibold uppercase tracking-[var(--letter-spacing-label)]",
            accentClass,
          )}
        >
          <span
            aria-hidden="true"
            className={cn("inline-block h-[2px] w-6 shrink-0", accentBgClass)}
          />
          <span>{resolved.kickerLabel}</span>
        </div>

        <div className="flex flex-col gap-1">
          {playerName && (
            <span
              data-testid="transfer-overview-name"
              className="font-title font-bold text-xl text-kcvv-white"
            >
              {playerName}
            </span>
          )}
          {metaParts.length > 0 && (
            <span
              data-testid="transfer-overview-meta"
              className="font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray-light"
            >
              {metaParts.map((part, i) => (
                <span key={part}>
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="mx-2 text-kcvv-white/30"
                    >
                      ·
                    </span>
                  )}
                  {part}
                </span>
              ))}
            </span>
          )}
        </div>

        {resolved.kind === "extension" ? (
          <div
            data-testid="transfer-overview-kcvv-only"
            className="flex items-center gap-2 text-base text-kcvv-white"
          >
            {resolved.kcvvOnly.logoUrl && (
              <Image
                src={resolved.kcvvOnly.logoUrl}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
              />
            )}
            <span>{resolved.kcvvOnly.name}</span>
          </div>
        ) : (
          <div
            data-testid="transfer-overview-clubs"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-kcvv-white"
          >
            <span className="flex items-center gap-2">
              {resolved.from.logoUrl && (
                <Image
                  src={resolved.from.logoUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
              )}
              {resolved.from.name}
            </span>
            <Icon icon={ArrowRight} size="xs" className={accentClass} />
            <span className="flex items-center gap-2">
              {resolved.to.logoUrl && (
                <Image
                  src={resolved.to.logoUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
              )}
              {resolved.to.name}
            </span>
          </div>
        )}

        <p
          data-testid="transfer-overview-status"
          className="font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray-light md:text-right"
        >
          {statusLabel}
        </p>
      </div>
    </section>
  );
};

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
 * Single horizontal row (flex on mobile → grid on md), 1 px top rule,
 * four slots:
 *
 *   [kicker]   [player + meta]   [clubs inline]   [status]
 *
 * Colour rules per direction:
 *   - `incoming`  kicker = `kcvv-green-dark`, arrow = `kcvv-green-bright`.
 *   - `outgoing`  kicker = `kcvv-warning` (amber — reported, not alarmed).
 *     Arrow = `kcvv-warning`.
 *   - `extension` kicker = `kcvv-green-dark`. No arrow — single KCVV row
 *     + `TOT {until}` status label on the right.
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
  const kickerClass = isOutgoing ? "text-kcvv-warning" : "text-kcvv-green-dark";
  const arrowClass = isOutgoing
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
        "not-prose border-t border-kcvv-gray-light py-6",
        "grid gap-x-6 gap-y-3",
        "md:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-center",
        className,
      )}
    >
      <div
        data-testid="transfer-overview-kicker"
        className={cn(
          "flex items-center gap-2 text-xs font-semibold uppercase tracking-[var(--letter-spacing-label)]",
          kickerClass,
        )}
      >
        <span
          aria-hidden="true"
          className={cn("inline-block h-[2px] w-6 shrink-0", accentBgClass)}
        />
        <span>{resolved.kickerLabel}</span>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {playerName && (
          <span
            data-testid="transfer-overview-name"
            className="font-title font-bold text-xl text-kcvv-gray-blue"
          >
            {playerName}
          </span>
        )}
        {metaParts.length > 0 && (
          <span
            data-testid="transfer-overview-meta"
            className="font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray"
          >
            {metaParts.map((part, i) => (
              <span key={part}>
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="mx-2 text-kcvv-gray-light"
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
          className="flex items-center gap-2 text-base text-kcvv-gray-blue"
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
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-kcvv-gray-blue"
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
          <Icon icon={ArrowRight} size="xs" className={arrowClass} />
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
        className="font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray md:text-right"
      >
        {statusLabel}
      </p>
    </section>
  );
};

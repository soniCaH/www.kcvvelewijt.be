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
 * subsequent transferFact blocks in a transfer article (the first one
 * renders as `TransferFactFeature`), or inline anywhere inside an
 * announcement body.
 *
 * Body-column width, 1 px top + bottom rules, no side borders, no radius.
 * Two rows:
 *   1. kicker (direction) · name · right-aligned age · position meta
 *   2. from→to club composition (or a single KCVV row + `until` on
 *      extensions)
 *
 * Outgoing direction renders the kicker in `kcvv-gray` — reported, not
 * celebrated (no red pill; the direction rejected that treatment during
 * the brainstorm).
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

  return (
    <section
      data-testid="transfer-overview"
      className={cn(
        "not-prose my-6 grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2",
        "border-y border-kcvv-gray-light py-4 max-w-[65ch]",
        className,
      )}
    >
      <p
        data-testid="transfer-overview-kicker"
        className={cn(
          "text-xs font-semibold uppercase tracking-[var(--letter-spacing-label)]",
          resolved.direction === "outgoing"
            ? "text-kcvv-gray"
            : "text-kcvv-green-dark",
        )}
      >
        {resolved.kickerLabel}
      </p>

      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
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

      <div aria-hidden="true" />
      {resolved.kcvvOnly ? (
        <div className="flex flex-col">
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
          {resolved.until && (
            <span
              data-testid="transfer-overview-until"
              className="mt-1 font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray"
            >
              tot {resolved.until}
            </span>
          )}
        </div>
      ) : (
        <div
          data-testid="transfer-overview-clubs"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-kcvv-gray-blue"
        >
          <span className="flex items-center gap-2">
            {resolved.from!.logoUrl && (
              <Image
                src={resolved.from!.logoUrl}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
              />
            )}
            {resolved.from!.name}
          </span>
          <Icon icon={ArrowRight} size="xs" className="text-kcvv-gray" />
          <span className="flex items-center gap-2">
            {resolved.to!.logoUrl && (
              <Image
                src={resolved.to!.logoUrl}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
              />
            )}
            {resolved.to!.name}
          </span>
        </div>
      )}
    </section>
  );
};

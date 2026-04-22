import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  resolveTransfer,
  type TransferFactValue,
  type TransferSide,
} from "./types";

export interface TransferFactFeatureProps {
  value: TransferFactValue;
  className?: string;
}

/**
 * Design §8.1 — feature variant of a `transferFact` block. Rendered as the
 * first transferFact in the body of an `articleType='transfer'` article;
 * subsequent blocks render as `TransferFactOverview` cards.
 *
 * Full-bleed cream-neutral band with a two-column grid: player cutout on
 * the left, kicker + name + from/to stack on the right. The KCVV row
 * carries a 2 px green accent bar; extensions collapse to a single KCVV
 * row plus an `until` label.
 */
export const TransferFactFeature = ({
  value,
  className,
}: TransferFactFeatureProps) => {
  const resolved = resolveTransfer(value);
  const { playerPhotoUrl, playerName, age, position, note } = value;
  const metaParts = [
    typeof age === "number" ? `${age} jaar` : null,
    position,
  ].filter((x): x is string => typeof x === "string" && x.length > 0);

  return (
    <section
      data-testid="transfer-feature"
      className={cn(
        "full-bleed my-10 border-y border-kcvv-gray-light bg-kcvv-white",
        "py-8 md:py-16",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-[70rem] px-6",
          "grid gap-10",
          "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]",
        )}
      >
        {playerPhotoUrl ? (
          <div
            data-testid="transfer-feature-photo"
            className="relative mx-auto w-full max-w-[420px] aspect-[4/5] md:self-end"
          >
            <Image
              src={playerPhotoUrl}
              alt={playerName ? `Portret van ${playerName}` : ""}
              fill
              sizes="(max-width: 768px) 90vw, 420px"
              className="object-contain object-bottom"
            />
          </div>
        ) : (
          <div aria-hidden="true" />
        )}

        <div className="flex flex-col">
          <p
            data-testid="transfer-feature-kicker"
            className={cn(
              "mb-6 flex flex-wrap items-center gap-x-3",
              "text-xs font-semibold uppercase tracking-[var(--letter-spacing-label)] text-kcvv-green-dark",
              "before:content-[''] before:block before:w-16 before:h-[2px] before:bg-kcvv-green-bright before:mr-1 before:shrink-0",
            )}
          >
            {/* CSS `uppercase` utility handles casing — kickerLabel arrives
                as Title Case from `resolveTransfer`. */}
            <span>{resolved.kickerLabel}</span>
          </p>

          {playerName && (
            <h2
              data-testid="transfer-feature-name"
              className="font-title font-bold text-kcvv-gray-blue leading-[0.95] text-5xl"
            >
              {playerName}
            </h2>
          )}

          {metaParts.length > 0 && (
            <p
              data-testid="transfer-feature-meta"
              className="mt-3 flex flex-wrap items-center gap-x-3 text-sm uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray"
            >
              {metaParts.map((part, i) => (
                <span key={part}>
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="mr-3 text-kcvv-gray-light"
                    >
                      ·
                    </span>
                  )}
                  {part}
                </span>
              ))}
            </p>
          )}

          <div className="mt-8 flex flex-col">
            {resolved.kcvvOnly ? (
              <>
                {/*
                  Extension = bare club row + `until` line beneath; design
                  §8.1 explicitly omits the `from`/`to`/`extension` label
                  above the row — the kicker at the top already names the
                  direction, so repeating it would be noise.
                */}
                <ClubRow
                  testId="transfer-feature-kcvv-only"
                  side={resolved.kcvvOnly}
                  accent
                />
                {resolved.until && (
                  <p
                    data-testid="transfer-feature-until"
                    className="mt-3 font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray"
                  >
                    tot {resolved.until}
                  </p>
                )}
              </>
            ) : (
              <>
                <ClubRow
                  testId="transfer-feature-from"
                  label="from"
                  side={resolved.from!}
                  accent={resolved.from!.isKcvv}
                />
                <hr
                  aria-hidden="true"
                  className="my-4 border-t border-kcvv-gray-light"
                />
                <ClubRow
                  testId="transfer-feature-to"
                  label="to"
                  side={resolved.to!}
                  accent={resolved.to!.isKcvv}
                />
              </>
            )}
          </div>

          {note && (
            <p
              data-testid="transfer-feature-note"
              className="mt-8 font-title text-xl text-kcvv-gray-dark"
            >
              {note}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

interface ClubRowProps {
  side: TransferSide;
  /**
   * Mono small-caps label rendered above the club line (`from`, `to`).
   * Omitted for the extension row — the kicker already names the
   * direction, so the row renders bare.
   */
  label?: string;
  accent: boolean;
  testId: string;
}

function ClubRow({ side, label, accent, testId }: ClubRowProps) {
  return (
    <div
      data-testid={testId}
      data-kcvv={side.isKcvv ? "true" : "false"}
      className={cn(
        "flex items-center gap-4 pl-4 relative",
        accent &&
          "before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-kcvv-green-bright",
      )}
    >
      <div className="flex flex-col">
        {label && (
          <span className="font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray">
            {label}
          </span>
        )}
        <span className={cn("flex items-center gap-3", label && "mt-1")}>
          {side.logoUrl && (
            <Image
              src={side.logoUrl}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          )}
          <span className="font-title font-medium text-2xl text-kcvv-gray-blue">
            {side.name}
          </span>
        </span>
      </div>
    </div>
  );
}

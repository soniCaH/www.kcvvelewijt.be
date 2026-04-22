import { cn } from "@/lib/utils/cn";
import {
  resolveTransfer,
  type TransferFactValue,
} from "@/components/article/blocks/TransferFact";

export interface TransferHeroProps {
  /**
   * The feature `transferFact` — first transferFact block in the body.
   * When null the hero renders a headline-only composition using
   * `fallbackTitle` (legacy article without structured transfer data).
   */
  feature: TransferFactValue | null;
  /**
   * Used when `feature` is null — article title becomes the headline so
   * the page still has an h1. Ignored when `feature` is provided.
   */
  fallbackTitle?: string;
  className?: string;
}

/**
 * Design §5.3 — transfer hero. Typographic only; there is no hero image.
 * The headline slot renders a programmatic from/to composition at display
 * scale using the first `transferFact` block in the body. Direction
 * rules (incoming/outgoing/extension) mirror the feature block exactly
 * so the hero and the feature card agree on who goes where.
 *
 * The interview hero carries a cover crop, the announcement hero carries
 * a 16:9 rounded cover — transfer is the only one without imagery, which
 * is why the display-size from/to composition has to do the heavy lift.
 */
export const TransferHero = ({
  feature,
  fallbackTitle,
  className,
}: TransferHeroProps) => {
  const resolved = feature ? resolveTransfer(feature) : null;
  const metaParts = feature
    ? [
        typeof feature.age === "number" ? `${feature.age} jaar` : null,
        feature.position,
      ].filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];

  // Keep the h1 slot required — an empty heading fails every a11y audit and
  // would silently ship if both signals were ever missing at once.
  const h1 = feature?.playerName ?? fallbackTitle ?? "Transfer";

  return (
    <header
      data-testid="transfer-hero"
      className={cn(
        "w-full max-w-inner-lg mx-auto px-6 pt-10 md:pt-16",
        className,
      )}
    >
      <div className="max-w-[65ch]">
        <p
          className={cn(
            "mb-6 flex flex-wrap items-center gap-x-3 gap-y-1",
            "text-xs font-semibold uppercase tracking-[var(--letter-spacing-label)] text-kcvv-green-dark",
            "before:content-[''] before:block before:w-16 before:h-[2px] before:bg-kcvv-green-bright before:mr-1 before:shrink-0",
          )}
          data-testid="transfer-hero-kicker"
        >
          <span>Transfer</span>
          {resolved && (
            <>
              <span aria-hidden="true" className="text-kcvv-gray-light">
                |
              </span>
              <span>{resolved.kickerLabel}</span>
            </>
          )}
        </p>

        <h1
          className="font-title font-bold text-kcvv-gray-blue leading-[0.95] text-[clamp(2.5rem,5.5vw,4.5rem)]"
          data-testid="transfer-hero-title"
        >
          {h1}
        </h1>

        {metaParts.length > 0 && (
          <p
            data-testid="transfer-hero-subtitle"
            className="mt-4 font-title font-normal text-2xl text-kcvv-gray-dark"
          >
            {metaParts.map((part, i) => (
              <span key={part}>
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="mx-3 text-kcvv-gray-light"
                  >
                    ·
                  </span>
                )}
                {part}
              </span>
            ))}
          </p>
        )}

        {resolved && (
          <div className="mt-10 flex flex-col gap-y-3 font-mono text-sm uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray">
            {resolved.kcvvOnly ? (
              <>
                <span data-testid="transfer-hero-kcvv-only">
                  <span
                    aria-hidden="true"
                    className="mr-4 inline-block w-12 text-kcvv-gray-light"
                  >
                    stays at
                  </span>
                  <span className="text-kcvv-gray-blue">
                    {resolved.kcvvOnly.name}
                  </span>
                </span>
                {resolved.until && (
                  <span data-testid="transfer-hero-until">
                    <span
                      aria-hidden="true"
                      className="mr-4 inline-block w-12 text-kcvv-gray-light"
                    >
                      until
                    </span>
                    <span>{resolved.until}</span>
                  </span>
                )}
              </>
            ) : (
              <>
                <span data-testid="transfer-hero-from">
                  <span
                    aria-hidden="true"
                    className="mr-4 inline-block w-12 text-kcvv-gray-light"
                  >
                    from
                  </span>
                  <span className="text-kcvv-gray-blue">
                    {resolved.from!.name}
                  </span>
                </span>
                <span data-testid="transfer-hero-to">
                  <span
                    aria-hidden="true"
                    className="mr-4 inline-block w-12 text-kcvv-gray-light"
                  >
                    to
                  </span>
                  <span className="text-kcvv-gray-blue">
                    {resolved.to!.name}
                  </span>
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

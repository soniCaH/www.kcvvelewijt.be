import { Fragment } from "react";
import { PortableText } from "@portabletext/react";
import type { QaPairValue } from "./QaBlock";

export interface QaGroupRapidFireProps {
  pairs: QaPairValue[];
}

/**
 * Design §6.4 — consecutive `rapid-fire` pairs are collapsed into a single
 * rhythm block with the editor-invisible "Sneltrein" header. The three
 * short bars in the header are 2 px × 0.5 rem `kcvv-green-bright` accents,
 * not em-dash characters.
 */
export const QaGroupRapidFire = ({ pairs }: QaGroupRapidFireProps) => {
  if (pairs.length === 0) return null;

  return (
    <section data-testid="qa-group-rapid-fire" className="my-12">
      <header className="mb-6 flex items-center gap-2">
        <span aria-hidden="true" className="flex items-center gap-1">
          <span className="block h-0.5 w-2 bg-kcvv-green-bright" />
          <span className="block h-0.5 w-2 bg-kcvv-green-bright" />
          <span className="block h-0.5 w-2 bg-kcvv-green-bright" />
        </span>
        <span className="ml-2 font-title font-bold text-xs uppercase tracking-[var(--letter-spacing-label)] text-kcvv-green-dark">
          Sneltrein
        </span>
      </header>

      <div>
        {pairs.map((pair, i) => (
          <Fragment key={pair._key ?? i}>
            {i > 0 && (
              <hr
                aria-hidden="true"
                className="my-6 border-t border-kcvv-gray-light"
              />
            )}
            <div className="grid gap-3 md:grid-cols-[1fr_1.3fr] md:gap-8">
              <p className="font-title font-medium text-base text-kcvv-gray-blue">
                {pair.question ?? ""}
              </p>
              <div className="font-body font-normal text-base text-kcvv-gray-dark [&>p+p]:mt-3">
                <PortableText value={pair.answer ?? []} />
              </div>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
};

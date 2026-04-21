import { Fragment } from "react";
import type { PortableTextBlock } from "@portabletext/react";
import { QaPairStandard } from "./QaPairStandard";

export interface QaPairValue {
  _key?: string;
  question?: string;
  answer?: PortableTextBlock[];
  tag?: string;
}

export interface QaBlockValue {
  pairs?: QaPairValue[];
}

/**
 * Phase 1 tracer: only the `standard` tag is implemented.
 * Unknown or missing tags fall back to `QaPairStandard` — Phase 2 will add
 * `key`, `quote`, and `rapid-fire` variants via a dispatch map here.
 */
export const QaBlock = ({ value }: { value: QaBlockValue }) => {
  const pairs = value.pairs ?? [];
  if (pairs.length === 0) return null;

  return (
    <div className="my-12" data-testid="qa-block">
      {pairs.map((pair, i) => {
        const isLast = i === pairs.length - 1;
        return (
          <Fragment key={pair._key ?? i}>
            <QaPairStandard
              index={i + 1}
              question={pair.question ?? ""}
              answer={pair.answer ?? []}
            />
            {!isLast && (
              <hr
                className="my-10 border-t border-kcvv-gray-light"
                aria-hidden="true"
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

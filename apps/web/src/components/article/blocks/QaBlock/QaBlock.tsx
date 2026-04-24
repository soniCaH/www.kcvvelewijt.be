import { Fragment } from "react";
import type { PortableTextBlock } from "@portabletext/react";
import { cn } from "@/lib/utils/cn";
import {
  resolvePairRespondent,
  type IndexedSubject,
} from "@/components/article/SubjectAttribution";
import { QaPairStandard } from "./QaPairStandard";
import { QaPairKey } from "./QaPairKey";
import { QaPairQuote } from "./QaPairQuote";
import { QaGroupRapidFire } from "./QaGroupRapidFire";

export interface QaPairValue {
  _key?: string;
  question?: string;
  answer?: PortableTextBlock[];
  tag?: string;
  /**
   * Points at the `_key` of one of `article.subjects[]`. Required on
   * multi-subject interviews' `key`/`quote` pairs; auto-resolved to
   * `subjects[0]` on single-subject interviews. Populated by the
   * `RespondentPicker` custom Studio input.
   */
  respondentKey?: string;
}

export interface QaBlockValue {
  pairs?: QaPairValue[];
}

export interface QaBlockProps {
  value: QaBlockValue;
  /**
   * Article-level subjects (from `article.subjects[]`). Each entry carries
   * the `_key` that `qaPair.respondentKey` points at, so `key`/`quote`
   * pairs can resolve to the right attribution in duo/panel interviews.
   * On single-subject interviews, the sole subject is used regardless of
   * `respondentKey`. Ignored by `standard` and `rapid-fire` pairs.
   */
  subjects?: IndexedSubject[] | null;
}

type Unit =
  | { kind: "standard"; pair: QaPairValue; standardIdx: number }
  | { kind: "key"; pair: QaPairValue }
  | { kind: "quote"; pair: QaPairValue }
  | { kind: "rapid-fire"; pairs: QaPairValue[] };

const assertNever = (value: never): never => {
  throw new Error(`Unhandled QaBlock unit kind: ${JSON.stringify(value)}`);
};

const isBreakoutTag = (tag?: string): tag is "key" | "quote" =>
  tag === "key" || tag === "quote";

/**
 * Collapse consecutive `rapid-fire` pairs into a single unit, assign each
 * `standard` pair its 1-based sequence number (breakouts skip the counter),
 * and fall back to `standard` for unknown tag values. Single pass over the
 * input — all mutation is local to this helper so the caller's render body
 * stays immutable.
 */
function groupPairs(pairs: QaPairValue[]): Unit[] {
  const units: Unit[] = [];
  let standardCount = 0;
  for (const pair of pairs) {
    if (pair.tag === "rapid-fire") {
      const last = units[units.length - 1];
      if (last?.kind === "rapid-fire") {
        last.pairs.push(pair);
      } else {
        units.push({ kind: "rapid-fire", pairs: [pair] });
      }
      continue;
    }
    if (isBreakoutTag(pair.tag)) {
      units.push({ kind: pair.tag, pair });
      continue;
    }
    standardCount += 1;
    units.push({ kind: "standard", pair, standardIdx: standardCount });
  }
  return units;
}

/**
 * Dispatches each qaPair to its per-tag renderer. Separator rules between
 * units:
 *   - Between two consecutive `standard` pairs: 1 px `kcvv-gray-light` rule.
 *   - Before/after `key`, `quote`, or `rapid-fire` units: no rule — the
 *     breakout block provides its own visual boundary.
 *
 * Standard pairs are numbered sequentially across the block (01., 02., …);
 * breakout units do not participate in the numeral counter.
 */
export const QaBlock = ({ value, subjects = null }: QaBlockProps) => {
  const pairs = value.pairs ?? [];
  if (pairs.length === 0) return null;

  const units = groupPairs(pairs);

  return (
    <div
      // Adjacent cream-band breakouts (key↔key / key↔quote / quote↔key /
      // quote↔quote) should butt against each other — a white strip
      // between two full-bleed sections reads as a broken rhythm. The
      // arbitrary selectors below zero the top margin on the trailing
      // breakout and the bottom margin on the leading breakout. Limited
      // to `section[data-testid^=qa-pair-]` so QaPairStandard (a div)
      // and QaGroupRapidFire are unaffected.
      className={cn(
        "not-prose my-12",
        "[&>section[data-testid^=qa-pair-]+section[data-testid^=qa-pair-]]:!mt-0",
        "[&>section[data-testid^=qa-pair-]:has(+section[data-testid^=qa-pair-])]:!mb-0",
      )}
      data-testid="qa-block"
    >
      {units.map((unit, i) => {
        const prev = units[i - 1];
        const needsRule =
          i > 0 && prev?.kind === "standard" && unit.kind === "standard";

        if (unit.kind === "standard") {
          return (
            <Fragment key={unit.pair._key ?? `std-${i}`}>
              {needsRule && (
                <hr
                  aria-hidden="true"
                  className="border-kcvv-gray-light my-10 border-t"
                />
              )}
              <QaPairStandard
                index={unit.standardIdx}
                question={unit.pair.question ?? ""}
                answer={unit.pair.answer ?? []}
              />
            </Fragment>
          );
        }

        if (unit.kind === "key") {
          const respondent = resolvePairRespondent(
            unit.pair.respondentKey,
            subjects,
          );
          return (
            <QaPairKey
              key={unit.pair._key ?? `key-${i}`}
              question={unit.pair.question ?? ""}
              answer={unit.pair.answer ?? []}
              subject={respondent}
            />
          );
        }

        if (unit.kind === "quote") {
          const respondent = resolvePairRespondent(
            unit.pair.respondentKey,
            subjects,
          );
          return (
            <QaPairQuote
              key={unit.pair._key ?? `quote-${i}`}
              answer={unit.pair.answer ?? []}
              subject={respondent}
            />
          );
        }

        if (unit.kind === "rapid-fire") {
          return (
            <QaGroupRapidFire
              key={unit.pairs[0]?._key ?? `rf-${i}`}
              pairs={unit.pairs}
            />
          );
        }

        // Exhaustiveness: forces a compile error if a new Unit kind lands
        // without a corresponding branch. The assertion is unreachable at
        // runtime given the type; kept as a belt-and-braces fallback.
        return assertNever(unit);
      })}
    </div>
  );
};

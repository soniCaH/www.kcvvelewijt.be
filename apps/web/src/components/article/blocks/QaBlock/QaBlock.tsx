import { Fragment, type ReactNode } from "react";
import { PortableText, type PortableTextBlock } from "@portabletext/react";
import {
  resolvePairRespondent,
  resolveSubject,
  buildUnanimousAttribution,
  deriveSubjectFirstName,
  joinFirstNames,
  ALL_RESPONDENTS_KEY,
  type IndexedSubject,
} from "@/components/article/SubjectAttribution";
import { QARow, type QARowRespondent } from "@/components/article/QARow";
import { PullQuote } from "@/components/design-system/PullQuote";
import {
  SubjectAvatar,
  SubjectAvatarCluster,
} from "@/components/design-system/SubjectAvatar";
import {
  QaGroupRapidFire,
  type QaGroupRapidFireRespondent,
} from "./QaGroupRapidFire";
import { flattenAnswerToString } from "./flattenAnswerToString";

export interface QaPairRespondentValue {
  _key?: string;
  /**
   * Points at the `_key` of one of `article.subjects[]`. Required on
   * multi-subject interviews' `key`/`quote` pairs; auto-resolved to
   * `subjects[0]` on single-subject interviews. Populated by the
   * `RespondentPicker` custom Studio input.
   */
  respondentKey?: string;
  answer?: PortableTextBlock[];
}

export interface QaPairValue {
  _key?: string;
  question?: string;
  tag?: string;
  respondents?: QaPairRespondentValue[];
}

export interface QaBlockValue {
  pairs?: QaPairValue[];
}

export interface QaBlockProps {
  value: QaBlockValue;
  /**
   * Article-level subjects (from `article.subjects[]`). Each entry carries
   * the `_key` that `qaPair.respondentKey` points at, so every pair can
   * resolve to the right attribution in duo/panel interviews. On
   * single-subject interviews, the sole subject is used regardless of
   * `respondentKey`.
   */
  subjects?: IndexedSubject[] | null;
}

type Unit =
  | { kind: "standard"; pair: QaPairValue }
  | { kind: "key"; pair: QaPairValue }
  | { kind: "quote"; pair: QaPairValue }
  | { kind: "rapid-fire"; pairs: QaPairValue[] };

const assertNever = (value: never): never => {
  throw new Error(`Unhandled QaBlock unit kind: ${JSON.stringify(value)}`);
};

const isBreakoutTag = (tag?: string): tag is "key" | "quote" =>
  tag === "key" || tag === "quote";

/** Role suffix rendered after the joined names on a unanimous answer. */
const UNANIMOUS_ROLE = "Unaniem";

/**
 * Collapse consecutive `rapid-fire` pairs into a single unit and fall back
 * to `standard` (rendered as `<QARow>`) for unknown tag values. Single pass
 * over the input — all mutation is local to this helper so the caller's
 * render body stays immutable.
 */
function groupPairs(pairs: QaPairValue[]): Unit[] {
  const units: Unit[] = [];
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
    units.push({ kind: "standard", pair });
  }
  return units;
}

function mapStandardRespondents(
  pair: QaPairValue,
  subjects: IndexedSubject[] | null,
): QARowRespondent[] {
  const sources = pair.respondents ?? [];
  return sources.map((src, i) => {
    const answer: ReactNode = src.answer ? (
      <PortableText value={src.answer} />
    ) : null;
    const respondentKey =
      src._key ?? src.respondentKey ?? `${pair._key ?? "p"}-${i}`;

    // "Unaniem" — one shared answer for every subject (#2276). Collapse
    // all resolvable subjects into a single combined respondent: joined
    // first names + "Unaniem" role + monogram cluster. Checked before the
    // normal single-subject resolve so the sentinel never falls through to
    // the "not in subjects" path.
    if (src.respondentKey === ALL_RESPONDENTS_KEY) {
      const members = buildUnanimousAttribution(subjects);
      if (members.length === 0) return { answer, respondentKey };
      const firstNames = members.map((m) => m.firstName);
      return {
        firstName: firstNames[0],
        fullName: joinFirstNames(firstNames),
        role: UNANIMOUS_ROLE,
        answer,
        respondentKey,
        cluster: members.length >= 2 ? members : undefined,
      };
    }

    const subject = resolvePairRespondent(src.respondentKey, subjects);
    const resolved = resolveSubject(subject);
    // No resolvable speaker (multi-subject article whose editors didn't
    // tag `respondentKey` on standard pairs — the Studio validator
    // only enforces respondentKey on `key`/`quote`). Render the pair
    // through QARow's no-speaker mode so the question + answer stay
    // visible — matches the pre-Phase-5 `<QaPairStandard>` semantics.
    if (!resolved) {
      return { answer, respondentKey };
    }
    const firstName = deriveSubjectFirstName(subject, resolved.name);
    return {
      firstName,
      fullName: resolved.name,
      role: resolved.role || undefined,
      answer,
      respondentKey,
    };
  });
}

/**
 * Dispatches each qaPair to its Phase-5 renderer. Separator rules between
 * units:
 *   - Between two consecutive `standard` (QARow) pairs: 1 px
 *     `paper-edge` rule.
 *   - Before/after `key`, `quote`, or `rapid-fire` units: no rule — those
 *     blocks provide their own visual boundary.
 */
export const QaBlock = ({ value, subjects = null }: QaBlockProps) => {
  const pairs = value.pairs ?? [];
  if (pairs.length === 0) return null;

  const units = groupPairs(pairs);
  const rendered: ReactNode[] = [];
  let lastRenderedKind: Unit["kind"] | null = null;

  units.forEach((unit, i) => {
    if (unit.kind === "standard") {
      const respondents = mapStandardRespondents(unit.pair, subjects);
      if (respondents.length === 0) return;
      // Separator rule only between two adjacent rendered standard units —
      // tracked via `lastRenderedKind` so a skipped standard (no resolvable
      // respondents) doesn't leave an orphan rule above the next one.
      const needsRule = lastRenderedKind === "standard";
      rendered.push(
        <Fragment key={unit.pair._key ?? `std-${i}`}>
          {needsRule && (
            <hr aria-hidden="true" className="border-paper-edge m-0 border-t" />
          )}
          <QARow
            question={unit.pair.question ?? ""}
            respondents={respondents}
          />
        </Fragment>,
      );
      lastRenderedKind = "standard";
      return;
    }

    if (unit.kind === "key" || unit.kind === "quote") {
      const tone = unit.kind === "key" ? "cream" : "ink";
      const first = unit.pair.respondents?.[0];
      const body = flattenAnswerToString(first?.answer);
      if (body.length === 0) return;
      // Unanimous breakout: render the pull-quote with combined attribution
      // (joined names + "Unaniem") and a monogram cluster so the answer
      // isn't dropped. Needs 2+ resolvable subjects.
      const isUnanimous = first?.respondentKey === ALL_RESPONDENTS_KEY;
      if (isUnanimous) {
        const members = buildUnanimousAttribution(subjects);
        if (members.length >= 2) {
          rendered.push(
            <PullQuote
              key={unit.pair._key ?? `${unit.kind}-${i}`}
              tone={tone}
              attribution={{
                name: joinFirstNames(members.map((m) => m.firstName)),
                role: UNANIMOUS_ROLE,
                source:
                  unit.kind === "key"
                    ? unit.pair.question?.trim() || undefined
                    : undefined,
              }}
              avatarSlot={
                <SubjectAvatarCluster members={members} scale="attribution" />
              }
            >
              {body}
            </PullQuote>,
          );
          lastRenderedKind = unit.kind;
          return;
        }
      }
      // Fewer than 2 resolvable subjects (single-subject article, or a
      // duo with one dangling ref): attribute a `__all__` breakout to the
      // sole resolvable subject rather than dropping the quote.
      const subject = isUnanimous
        ? ((subjects ?? []).find((s) => resolveSubject(s) != null) ?? null)
        : resolvePairRespondent(first?.respondentKey, subjects);
      const resolved = resolveSubject(subject);
      if (!resolved) return;
      const firstName = deriveSubjectFirstName(subject, resolved.name);
      rendered.push(
        <PullQuote
          key={unit.pair._key ?? `${unit.kind}-${i}`}
          tone={tone}
          attribution={{
            name: resolved.name,
            role: resolved.role || undefined,
            source:
              unit.kind === "key"
                ? unit.pair.question?.trim() || undefined
                : undefined,
          }}
          avatarSlot={
            <SubjectAvatar
              firstName={firstName}
              fullName={resolved.name}
              photoUrl={resolved.photoUrl}
              scale="attribution"
            />
          }
        >
          {body}
        </PullQuote>,
      );
      lastRenderedKind = unit.kind;
      return;
    }

    if (unit.kind === "rapid-fire") {
      const firstWithKey = unit.pairs.find(
        (p) => p.respondents?.[0]?.respondentKey,
      );
      const subject =
        resolvePairRespondent(
          firstWithKey?.respondents?.[0]?.respondentKey,
          subjects,
        ) ??
        subjects?.[0] ??
        null;
      const resolved = resolveSubject(subject);
      let respondent: QaGroupRapidFireRespondent | undefined;
      if (resolved) {
        const firstName = deriveSubjectFirstName(subject, resolved.name);
        respondent = {
          firstName,
          fullName: resolved.name,
          role: resolved.role || undefined,
        };
      }
      rendered.push(
        <QaGroupRapidFire
          key={unit.pairs[0]?._key ?? `rf-${i}`}
          pairs={unit.pairs}
          respondent={respondent}
        />,
      );
      lastRenderedKind = "rapid-fire";
      return;
    }

    assertNever(unit);
  });

  if (rendered.length === 0) return null;

  return (
    // `gap-10` provides consistent vertical breathing room between every
    // pair of consecutive units — standard QARow → PullQuote, PullQuote →
    // QARow, QARow → QaGroupRapidFire, etc. The pre-Phase-5 QaPair*
    // components shipped their own `my-10`; PullQuote / QARow don't, so
    // the wrapper has to own the rhythm. The HR separator between
    // consecutive standards uses `m-0` so the gap-10 above + gap-10
    // below give it ~80px total breathing room (same as the original
    // `my-10 hr + my-10 hr` rhythm).
    <div
      className="not-prose my-12 flex flex-col gap-10"
      data-testid="qa-block"
    >
      {rendered}
    </div>
  );
};

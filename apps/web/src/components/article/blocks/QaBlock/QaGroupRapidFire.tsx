import { Fragment } from "react";
import { PortableText } from "@portabletext/react";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { SubjectAvatar } from "@/components/design-system/SubjectAvatar";
import type { QaPairValue } from "./QaBlock";

export interface QaGroupRapidFireRespondent {
  /** First name — drives the row-scale monogram avatar in the speaker strip. */
  firstName: string;
  /** Full display name for the mono caps speaker tag. */
  fullName?: string;
  /** Optional role suffix shown after the name. */
  role?: string;
}

export interface QaGroupRapidFireProps {
  /**
   * Consecutive rapid-fire qaPairs collapsed into one run by the
   * `<QaBlock>` dispatcher. Single-respondent by design (qaPair lock).
   */
  pairs: QaPairValue[];
  /**
   * Single respondent for the run. Renders the speaker strip beneath the
   * `Kort & Krachtig` opener. When omitted, the speaker strip is
   * suppressed — useful for legacy data that predates the subjects[]
   * schema, and for Storybook fixtures focused on the pair grid.
   */
  respondent?: QaGroupRapidFireRespondent;
}

/**
 * Phase 5 rewrite (interview-rapidfire-locked.md). Replaces the legacy
 * bright-green `Sneltrein` chrome with:
 *
 *   ────────────── Kort & Krachtig ──────────────   ← ruled MonoLabel opener
 *   [●L] LARS JANSSENS · AANVALLER                  ← speaker strip
 *   FAVORIETE GOAL    De volley tegen Diest …       ← hanging-Q row
 *   ............................................   ← dotted ink-muted divider
 *   SPELER OM TE VOLGEN  Wim. Hij maakt …
 *
 * Desktop (≥ 640px): 132px mono-caps question rail + 22px gap + italic
 * Freight Display answer body. Mobile collapses to a single column with
 * Q stacked above A.
 *
 * Empty answers render an explicit `—` ink-muted glyph in the answer
 * slot so the rhythm doesn't break.
 */
export const QaGroupRapidFire = ({
  pairs,
  respondent,
}: QaGroupRapidFireProps) => {
  if (pairs.length === 0) return null;

  return (
    <section data-testid="qa-group-rapid-fire" className="not-prose my-12">
      {/* Section opener — MonoLabel between two 1px ink hairlines. */}
      <header
        data-rapidfire="opener"
        className="mb-[22px] flex items-center gap-[14px]"
      >
        <span aria-hidden="true" className="bg-ink h-px flex-1" />
        <MonoLabel tone="ink">Kort &amp; Krachtig</MonoLabel>
        <span aria-hidden="true" className="bg-ink h-px flex-1" />
      </header>

      {/* Speaker strip — 32px monogram + mono caps tag. */}
      {respondent ? (
        <div
          data-rapidfire="speaker"
          className="mb-[18px] flex items-center gap-3"
        >
          <SubjectAvatar
            firstName={respondent.firstName}
            fullName={respondent.fullName}
            scale="row"
          />
          <p
            data-rapidfire="speaker-tag"
            className="text-ink-muted m-0 flex h-8 items-center font-mono text-[length:var(--text-label)] tracking-[var(--text-label--tracking)] uppercase"
          >
            <span className="text-ink">
              {(respondent.fullName ?? respondent.firstName).trim()}
            </span>
            {respondent.role ? (
              <>
                <span aria-hidden="true" className="mx-1.5">
                  ·
                </span>
                <span>{respondent.role}</span>
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      {/* Pair list — hanging-Q layout on ≥ 640px, stacked < 640px. */}
      <div data-rapidfire="pairs">
        {pairs.map((pair, i) => {
          const answer = pair.respondents?.[0]?.answer ?? [];
          const hasAnswer = Array.isArray(answer) && answer.length > 0;
          const isLast = i === pairs.length - 1;
          return (
            <Fragment key={pair._key ?? `rf-${i}`}>
              <div
                data-rapidfire="pair"
                className="grid grid-cols-1 items-baseline gap-y-[5px] py-3 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-x-[22px] sm:gap-y-0 sm:py-[14px]"
              >
                <p
                  data-rapidfire="question"
                  className="text-ink-muted m-0 font-mono text-[10px] leading-[1.45] font-medium tracking-[0.16em] uppercase"
                >
                  {pair.question ?? ""}
                </p>
                <div
                  data-rapidfire="answer"
                  className="font-display text-ink m-0 text-[16px] leading-[1.55] italic"
                >
                  {hasAnswer ? (
                    <PortableText value={answer} />
                  ) : (
                    <span aria-hidden="true" className="text-ink-muted">
                      —
                    </span>
                  )}
                </div>
              </div>
              {!isLast && (
                <hr
                  data-rapidfire="divider"
                  aria-hidden="true"
                  className="border-ink-muted m-0 border-0 border-t border-dotted"
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
};

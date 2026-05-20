import type { ReactNode } from "react";
import { SubjectAvatar } from "@/components/design-system/SubjectAvatar";
import { cn } from "@/lib/utils/cn";

/**
 * <QARow> — net-new Phase 5 interview primitive (5.d-int Round 1 lock).
 *
 * Single Q&A row in the interview body, modelled as one question with
 * one or more respondents. The visual always reads question-first,
 * respondent-block(s) below — both single and multi respondent cases
 * share the same vertical rhythm:
 *
 *   ```text
 *   Wat was het moment dat alles draaide?    ← question (italic display-sm)
 *
 *   [●L] LARS · AANVALLER                    ← respondent 1 header
 *        Halfweg de eerste helft …          ← respondent 1 answer (pl-11)
 *
 *   [●N] NIELS · MIDDENVELDER                ← respondent 2 header (only if N>1)
 *        Voor mij was het de stage.          ← respondent 2 answer
 *   ```
 *
 * The 2-col speaker-block layout (monogram avatar + answer indent)
 * stays per the 5.d2 D lock — no left-column ordinal marker.
 *
 * The unified array API lets the consumer (typically the qaBlock PT
 * serializer or `<QASection>`) wire either shape without branching.
 * Sanity schema migration to support multi-respondent qaBlocks (e.g.
 * `respondents[]` array) is a PRD §11 follow-up — the renderer ships
 * ahead of the schema, same pattern as the accent decorator + pullQuote
 * serializer.
 */
export interface QARowRespondent {
  /**
   * First name — drives the monogram avatar (first letter, uppercased)
   * per the 5.d2 lock. For custom subjects pass `customName`; for
   * player/staff subjects pass `firstName`. Omit (`undefined`) to render
   * the row without a speaker header — used for `standard` pairs in
   * multi-subject articles whose editors didn't tag `respondentKey`
   * (legacy/optional-attribution path).
   */
  firstName?: string;
  /**
   * Full display name for the speaker tag + avatar's accessible name.
   * Falls back to `firstName`.
   */
  fullName?: string;
  /**
   * Speaker role/jersey/function suffix shown in the mono caps tag
   * after the name (e.g. "AANVALLER", "TRAINER", "#9"). When omitted,
   * the tag renders just the name.
   */
  role?: string;
  /**
   * body-md answer. ReactNode so the caller can supply pre-rendered
   * Portable Text with marks, links, and the `accent` decorator.
   */
  answer: ReactNode;
  /**
   * Stable React key. Use the qaBlock `_key`/respondent `_key` from
   * Sanity, or any unique value for non-PT call-sites.
   */
  respondentKey?: string;
}

export interface QARowProps {
  /**
   * Italic display-sm 600 question text. Plain string — interviewer
   * questions rarely carry inline emphasis; expand the API to PT if
   * editorial need surfaces.
   */
  question: string;
  /**
   * One or more respondents. `length === 1` renders the canonical
   * single-speaker row; `length > 1` lifts the question to full width
   * and stacks per-respondent answer blocks below.
   */
  respondents: QARowRespondent[];
  className?: string;
}

interface SpeakerHeaderProps {
  firstName: string;
  fullName?: string;
  role?: string;
}

function SpeakerHeader({ firstName, fullName, role }: SpeakerHeaderProps) {
  const tagName = (fullName ?? firstName).trim();
  return (
    <header className="flex items-center gap-3">
      <SubjectAvatar firstName={firstName} fullName={fullName} scale="row" />
      <p
        data-qa-row="speaker-tag"
        // `m-0` overrides the global `p { margin-bottom: 1rem }` rule in
        // globals.css so the `<p>`'s outer box equals its 32px content
        // box. Without this the parent flex `items-center` centres a
        // 48px box, pushing the text to the top of the visible area.
        className="text-ink-muted m-0 flex h-8 items-center font-mono text-[length:var(--text-label)] tracking-[var(--text-label--tracking)] uppercase"
      >
        <span className="text-ink">{tagName}</span>
        {role ? (
          <>
            <span aria-hidden="true" className="mx-1.5">
              ·
            </span>
            <span>{role}</span>
          </>
        ) : null}
      </p>
    </header>
  );
}

export function QARow({ question, respondents, className }: QARowProps) {
  const isMulti = respondents.length > 1;
  if (respondents.length === 0) return null;

  if (!isMulti) {
    const r = respondents[0]!;
    const hasSpeaker =
      typeof r.firstName === "string" && r.firstName.trim().length > 0;
    return (
      <article
        data-qa-row="true"
        data-qa-row-mode="single"
        data-qa-row-has-speaker={hasSpeaker ? "true" : "false"}
        className={cn("flex flex-col", className)}
      >
        {hasSpeaker && (
          <SpeakerHeader
            firstName={r.firstName!}
            fullName={r.fullName}
            role={r.role}
          />
        )}
        {/*
          Body indent: 32px avatar + 12px header gap = `pl-11`. Keeps
          question + answer flush under the speaker name, not under the
          avatar disc. Drop the indent when there's no speaker header —
          the row reads as a plain numbered-style Q&A in that case
          (fallback for multi-subject articles with untagged
          respondents).
        */}
        <div
          className={cn("flex flex-col gap-2", hasSpeaker ? "mt-3 pl-11" : "")}
        >
          <h3
            data-qa-row="question"
            className="font-display text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)] font-semibold italic"
          >
            {question}
          </h3>
          <div
            data-qa-row="answer"
            className="text-body-md leading-[var(--text-body-md--lh)]"
          >
            {r.answer}
          </div>
        </div>
      </article>
    );
  }

  // Multi-respondent — lift the question above the respondents (full
  // width) so it reads as a single prompt addressed to everyone, then
  // stack each respondent's avatar + tag + answer below. Each
  // respondent's speaker header is conditional on `firstName` so a
  // duo pair with one untagged respondent renders the speaker for the
  // resolvable side and falls back to a plain answer block for the
  // other (still better than dropping the answer entirely).
  return (
    <article
      data-qa-row="true"
      data-qa-row-mode="multi"
      data-qa-row-respondent-count={respondents.length}
      className={cn("flex flex-col", className)}
    >
      <h3
        data-qa-row="question"
        className="font-display text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)] font-semibold italic"
      >
        {question}
      </h3>
      <div className="mt-5 flex flex-col gap-6">
        {respondents.map((r, i) => {
          const hasSpeaker =
            typeof r.firstName === "string" && r.firstName.trim().length > 0;
          return (
            <div
              key={r.respondentKey ?? `${r.firstName ?? "anon"}-${i}`}
              data-qa-row="respondent"
              data-qa-row-respondent-index={i}
              data-qa-row-has-speaker={hasSpeaker ? "true" : "false"}
            >
              {hasSpeaker && (
                <SpeakerHeader
                  firstName={r.firstName!}
                  fullName={r.fullName}
                  role={r.role}
                />
              )}
              <div
                data-qa-row="answer"
                className={cn(
                  "text-body-md leading-[var(--text-body-md--lh)]",
                  hasSpeaker ? "mt-2 pl-11" : "",
                )}
              >
                {r.answer}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

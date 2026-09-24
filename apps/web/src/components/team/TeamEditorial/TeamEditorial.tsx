/**
 * <TeamEditorial> — Phase 6.C editorial section for `/ploegen/[slug]`,
 * rendered under the page's own "Trainingen & contact" `<h2>` (#2637 —
 * `page.tsx` owns that heading via `<SectionHeader>`, the same composition
 * every other gated section uses; this component owns only the `<h3>`
 * sub-blocks below it).
 *
 * Three blocks, one always on:
 *  - **Trainingen** — unconditional. `team.trainingSchedule` was deleted
 *    outright by #2582 (field and all), so there is no CMS field left to
 *    gate this on: the block always routes to ProSoccerData instead of
 *    confessing an unfilled surface (#2637 decision comment, 2026-08-18).
 *  - **Het verhaal** (`team.body`) — Portable Text prose, conditional.
 *    Reuses the 6.A `pullquote` decorator serializer (inline
 *    `<HighlighterStroke>`); the first pullquote run is lifted into a
 *    `<PullQuote>` card centred below the paragraph it echoes ("same text,
 *    two surfaces", 6.A.d5). It shares "Het verhaal"'s section rather than
 *    owning one of its own and sits in no aside column, so it renders at
 *    the default flow placement (cream) per #2515 rule 5 — not a jersey
 *    card kept for its old pixels. Attribution is intentionally omitted —
 *    a team has no single speaker and named-coach data is not fabricated
 *    (#1944 open Q).
 *  - **Contact** (`team.contactInfo`) — Portable Text prose, conditional.
 *
 * `body`/`contactInfo` keep their independent auto-hide (#2637 decision
 * comment: "contactInfo and body keep their conditional behaviour") — an
 * editor filling either one still wins over the routing copy by appearing
 * alongside it, never replacing it. The section itself never returns
 * `null` any more: Trainingen alone is enough to keep it on the page.
 */

import { PortableText } from "@portabletext/react";
import type {
  PortableTextBlock,
  PortableTextComponents,
} from "@portabletext/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { HighlighterStroke } from "@/components/design-system/HighlighterStroke";
import { PullQuote } from "@/components/design-system/PullQuote";
import { ExternalMark } from "@/components/design-system/ExternalMark";
import { EXTERNAL_LINKS } from "@/lib/constants";
import {
  findNthPullquoteText,
  hasRenderableBioContent,
} from "@/lib/portable-text/findPullquoteText";

export interface TeamEditorialProps {
  /** `team.body` Portable Text — "Het verhaal" block. */
  body?: PortableTextBlock[] | null;
  /** `team.contactInfo` Portable Text — contact block. */
  contactInfo?: PortableTextBlock[] | null;
  /**
   * What to call this team in the Trainingen routing sentence —
   * `team.displayName`, resolved once at the page boundary (`page.tsx`),
   * not re-derived here. Deliberately never `team.ageGroup`: `age` is a
   * competition band, not the team's identity (`teamDisplayName()`'s own
   * docblock — #2630/#2539), and using it here reintroduced that exact bug
   * in review round 1 (`kcvve-u16` carries `age: "U17"`).
   */
  teamLabel: string;
  className?: string;
}

// Reuses the 6.A pullquote decorator serializer (BioBlock): the marked run
// renders inline with a jersey HighlighterStroke pulled across it.
const pullquoteComponents: PortableTextComponents = {
  marks: {
    pullquote: ({ children }: { children?: ReactNode }) => (
      <HighlighterStroke color="jersey">{children}</HighlighterStroke>
    ),
  },
};

function hasBody(body: PortableTextBlock[] | null | undefined): boolean {
  return (
    Array.isArray(body) && body.length > 0 && hasRenderableBioContent(body)
  );
}

export function TeamEditorial({
  body,
  contactInfo,
  teamLabel,
  className,
}: TeamEditorialProps) {
  const showVerhaal = hasBody(body);
  const showContact = hasBody(contactInfo);

  const pullquoteText = showVerhaal ? findNthPullquoteText(body!, 0) : null;

  return (
    <div
      data-testid="team-editorial"
      className={cn(
        "mx-auto flex w-full max-w-[var(--container-prose)] flex-col gap-12",
        className,
      )}
    >
      {showVerhaal ? (
        <section data-testid="team-editorial-verhaal">
          <EditorialHeading
            level={3}
            size="display-sm"
            emphasis={{ text: "." }}
          >
            Het verhaal
          </EditorialHeading>
          <div className="text-ink font-body mt-4 text-base leading-relaxed">
            <PortableText value={body!} components={pullquoteComponents} />
          </div>
          {pullquoteText !== null ? (
            <div className="mt-8 flex justify-center">
              {/* No speaker to attribute (see docblock) and no context
                  labels — the null path. `attribution={undefined}`
                  (rather than omitting the prop) is required by
                  PullQuoteProps' attribution-XOR-labels union. */}
              <PullQuote attribution={undefined} rotation={2}>
                {pullquoteText}
              </PullQuote>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Unconditional (#2637) — the training half of the routing exception.
          `team.trainingSchedule` no longer exists (#2582), so there is no
          field left to gate this on: it always points at ProSoccerData
          rather than confessing an unfilled CMS surface. */}
      <section data-testid="team-editorial-training">
        <EditorialHeading level={3} size="display-sm" emphasis={{ text: "." }}>
          Trainingen
        </EditorialHeading>
        <p className="text-ink font-body mt-4 text-base leading-relaxed">
          De trainingsuren van {teamLabel} staan nog niet op de site. Je vindt
          ze in{" "}
          <a
            href={EXTERNAL_LINKS.psdDashboard}
            target="_blank"
            rel="noopener noreferrer"
            className="prose-link"
          >
            ProSoccerData
            <ExternalMark />
          </a>
          .
        </p>
      </section>

      {showContact ? (
        <section data-testid="team-editorial-contact">
          <EditorialHeading
            level={3}
            size="display-sm"
            emphasis={{ text: "." }}
          >
            Contact
          </EditorialHeading>
          <div className="text-ink font-body mt-4 text-base leading-relaxed">
            <PortableText value={contactInfo!} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

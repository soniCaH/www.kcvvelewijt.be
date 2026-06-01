/**
 * <TeamEditorial> — Phase 6.C editorial section for `/ploegen/[slug]`.
 *
 * Three independently auto-hiding blocks:
 *  - **Het verhaal** (`team.body`) — Portable Text prose. Reuses the 6.A
 *    `pullquote` decorator serializer (inline `<HighlighterStroke>`); the first
 *    pullquote run is lifted into a jersey `<PullQuote>` card ("same text, two
 *    surfaces", 6.A.d5). Attribution is intentionally omitted — a team has no
 *    single speaker and named-coach data is not fabricated (#1944 open Q).
 *  - **Trainingsschema** (`team.trainingSchedule[]`) — compact table.
 *  - **Contact** (`team.contactInfo`) — Portable Text prose.
 *
 * The whole section returns `null` when every block is empty.
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
import {
  findNthPullquoteText,
  hasRenderableBioContent,
} from "@/lib/portable-text/findPullquoteText";

export interface TeamTrainingSession {
  day?: string | null;
  time?: string | null;
  location?: string | null;
  type?: string | null;
}

export interface TeamEditorialProps {
  /** `team.body` Portable Text — "Het verhaal" block. */
  body?: PortableTextBlock[] | null;
  /** `team.trainingSchedule[]` — compact training table. */
  trainingSchedule?: readonly TeamTrainingSession[] | null;
  /** `team.contactInfo` Portable Text — contact block. */
  contactInfo?: PortableTextBlock[] | null;
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

function hasRows(schedule: TeamEditorialProps["trainingSchedule"]): boolean {
  return Array.isArray(schedule) && schedule.length > 0;
}

function hasBody(body: PortableTextBlock[] | null | undefined): boolean {
  return (
    Array.isArray(body) && body.length > 0 && hasRenderableBioContent(body)
  );
}

export function TeamEditorial({
  body,
  trainingSchedule,
  contactInfo,
  className,
}: TeamEditorialProps) {
  const showVerhaal = hasBody(body);
  const showTraining = hasRows(trainingSchedule);
  const showContact = hasBody(contactInfo);

  if (!showVerhaal && !showTraining && !showContact) return null;

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
            level={2}
            size="display-sm"
            emphasis={{ text: "." }}
          >
            Het verhaal
          </EditorialHeading>
          <div className="text-ink font-body mt-4 text-base leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0">
            <PortableText value={body!} components={pullquoteComponents} />
          </div>
          {pullquoteText !== null ? (
            <div className="mt-8 flex justify-center">
              <PullQuote tone="jersey" attribution={{ name: "" }} rotation={2}>
                {pullquoteText}
              </PullQuote>
            </div>
          ) : null}
        </section>
      ) : null}

      {showTraining ? (
        <section data-testid="team-editorial-training">
          <EditorialHeading
            level={2}
            size="display-sm"
            emphasis={{ text: "." }}
          >
            Trainingsschema
          </EditorialHeading>
          <table className="mt-4 w-full border-collapse font-mono text-xs">
            <thead>
              <tr className="border-ink border-b-2">
                <th className="text-ink-muted py-2 pr-3 text-left tracking-wider uppercase">
                  Dag
                </th>
                <th className="text-ink-muted py-2 pr-3 text-left tracking-wider uppercase">
                  Tijd
                </th>
                <th className="text-ink-muted py-2 pr-3 text-left tracking-wider uppercase">
                  Locatie
                </th>
                <th className="text-ink-muted py-2 text-left tracking-wider uppercase">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {trainingSchedule!.map((session, i) => (
                <tr
                  key={`${session.day ?? ""}-${session.time ?? ""}-${i}`}
                  className="border-b border-[color:var(--color-paper-edge)]"
                >
                  <td className="text-ink py-2 pr-3">{session.day ?? "—"}</td>
                  <td className="text-ink py-2 pr-3 tabular-nums">
                    {session.time ?? "—"}
                  </td>
                  <td className="text-ink py-2 pr-3">
                    {session.location ?? "—"}
                  </td>
                  <td className="text-ink-muted py-2">{session.type ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {showContact ? (
        <section data-testid="team-editorial-contact">
          <EditorialHeading
            level={2}
            size="display-sm"
            emphasis={{ text: "." }}
          >
            Contact
          </EditorialHeading>
          <div className="text-ink font-body mt-4 text-base leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0">
            <PortableText value={contactInfo!} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

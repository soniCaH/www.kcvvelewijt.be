import { cn } from "@/lib/utils/cn";

/** W/D/L + goals tally for the opponent-history hero, computed by the BFF. */
export interface OpponentSummary {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface OpponentSummaryCardProps {
  summary: OpponentSummary;
  className?: string;
}

/**
 * Bordered paper stat card — five cells (W · G · V · DV · DT) computed from
 * finished matches only. Reuses the design-system paper-card vocabulary
 * (`border-2 border-ink` + `shadow-paper-sm`, sharp corners); no existing
 * primitive covers a divided stat row. Win is `jersey-deep`, loss is `alert`,
 * everything else neutral `ink` — the status colour lock from #2117.
 *
 * Each cell is a `<dt>`/`<dd>` pair (the abbreviation is the term, the count the
 * description) rendered value-on-top via `flex-col-reverse`, with the full Dutch
 * word exposed to assistive tech via an `.sr-only` span.
 */
export function OpponentSummaryCard({
  summary,
  className,
}: OpponentSummaryCardProps) {
  const cells: ReadonlyArray<{
    value: number;
    label: string;
    a11y: string;
    tone: string;
  }> = [
    {
      value: summary.wins,
      label: "W",
      a11y: "winst",
      tone: "text-jersey-deep",
    },
    { value: summary.draws, label: "G", a11y: "gelijk", tone: "text-ink" },
    { value: summary.losses, label: "V", a11y: "verlies", tone: "text-alert" },
    {
      value: summary.goalsFor,
      label: "DV",
      a11y: "doelpunten voor",
      tone: "text-ink",
    },
    {
      value: summary.goalsAgainst,
      label: "DT",
      a11y: "doelpunten tegen",
      tone: "text-ink",
    },
  ];

  return (
    <dl
      data-testid="opponent-summary"
      className={cn(
        "border-ink bg-cream shadow-paper-sm grid grid-cols-5 border-2",
        className,
      )}
    >
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="border-ink flex flex-col-reverse items-center gap-2 border-r-2 px-1.5 py-4 last:border-r-0"
        >
          <dt className="text-ink-muted font-mono text-[9px] tracking-[0.1em] uppercase">
            <span aria-hidden="true">{cell.label}</span>
            <span className="sr-only">{cell.a11y}</span>
          </dt>
          <dd
            className={cn(
              "font-display-big text-[28px] leading-none",
              cell.tone,
            )}
          >
            {cell.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

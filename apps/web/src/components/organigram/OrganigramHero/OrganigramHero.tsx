import { EditorialHeading, TapedCard } from "@/components/design-system";
import { HubSearch } from "../HubSearch";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import type { StructureIndex } from "./structure-index";

/** Audience chips — deep-link into Hulp (the per-audience filter lands in #2056). */
const AUDIENCE_CHIPS: ReadonlyArray<{ label: string; audience: string }> = [
  { label: "Ik ben ouder", audience: "ouder" },
  { label: "Speler", audience: "speler" },
  { label: "Trainer", audience: "trainer" },
  { label: "Supporter", audience: "supporter" },
];

export interface OrganigramHeroProps {
  members: OrgChartNode[];
  responsibilityPaths: ResponsibilityPath[];
  structureIndex: StructureIndex;
  /** Warm mono kicker (cross-/club cohesion). */
  kicker?: string;
  /** Display heading; a trailing warm period is added automatically. */
  heading?: string;
  lead?: string;
}

/**
 * <OrganigramHero> — the `/hulp` hub hero (design lock 7o1, A+C graft): a
 * jersey-deep-dark "roster spotlight" band (2px ink border · paper shadow ·
 * radial jersey wash) wearing the find-a-contact tool's search inside it.
 *
 * Left: warm kicker "De club" · `<EditorialHeading>` "Wie doet wat." (warm
 * period) · italic lead · the embedded `<HubSearch>` · audience chips → Hulp.
 * Right: a cream taped **structure artefact** — an abstract paper org-tree motif
 * (no names) + the derivable structure index (positions / people / departments).
 */
export function OrganigramHero({
  members,
  responsibilityPaths,
  structureIndex,
  kicker = "De club",
  heading = "Wie doet wat",
  lead = "Het bestuur, de jeugdwerking en de mensen erachter — typ een naam, functie of vraag, of blader hieronder door de structuur.",
}: OrganigramHeroProps) {
  return (
    <header
      id="hub-hero"
      className="bg-jersey-deep-dark border-ink relative border-2 px-6 py-8 shadow-[6px_6px_0_0_var(--color-ink)] sm:px-9 sm:py-10"
    >
      {/* Radial jersey wash — decorative. `inset-0` keeps it bounded to the
          band without an `overflow-hidden` that would clip the search dropdown. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 72% 0%, rgba(74,207,82,0.14), transparent 60%)",
        }}
      />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
        {/* Left — voice + search + chips. */}
        <div className="flex flex-col gap-5">
          <span className="text-warm font-mono text-[12px] font-semibold tracking-[0.18em] uppercase">
            {kicker}
          </span>

          <EditorialHeading
            level={1}
            size="display-xl"
            tone="cream"
            emphasis={{ text: ".", tone: "warm" }}
            className="mb-0"
          >
            {heading}
          </EditorialHeading>

          <p className="text-cream/80 font-display max-w-[42ch] text-[17px] leading-[1.45] italic">
            {lead}
          </p>

          <HubSearch
            members={members}
            responsibilityPaths={responsibilityPaths}
            variant="hero"
            className="max-w-[480px]"
          />

          <ul className="flex flex-wrap gap-2">
            {AUDIENCE_CHIPS.map((chip) => (
              <li key={chip.audience}>
                <a
                  href="#hulp"
                  data-audience={chip.audience}
                  className="border-cream/50 text-cream hover:bg-cream hover:text-jersey-deep-dark inline-block border px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.06em] uppercase transition-colors duration-200"
                >
                  {chip.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — non-person structure artefact (counts only, no faces). */}
        <div className="justify-self-center lg:justify-self-end">
          <TapedCard
            bg="cream-soft"
            rotation="a"
            shadow="lift"
            padding="md"
            tape={{
              color: "warm",
              length: "md",
              position: "left",
              verticalEdge: "top",
            }}
            className="w-full max-w-[280px]"
          >
            <p className="text-ink-muted mb-2 text-center font-mono text-[10px] tracking-[0.1em] uppercase">
              De structuur
            </p>

            <svg
              className="mx-auto block"
              width="210"
              height="112"
              viewBox="0 0 210 118"
              aria-hidden
            >
              <g fill="none" stroke="var(--color-ink)" strokeWidth="2">
                <line x1="105" y1="26" x2="105" y2="40" />
                <line x1="48" y1="40" x2="162" y2="40" />
                <line x1="48" y1="40" x2="48" y2="52" />
                <line x1="105" y1="40" x2="105" y2="52" />
                <line x1="162" y1="40" x2="162" y2="52" />
                <line x1="162" y1="78" x2="162" y2="90" />
                <line x1="134" y1="90" x2="190" y2="90" />
                <line x1="134" y1="90" x2="134" y2="100" />
                <line x1="190" y1="90" x2="190" y2="100" />
              </g>
              <rect
                x="84"
                y="8"
                width="42"
                height="18"
                fill="var(--color-jersey-deep)"
                stroke="var(--color-ink)"
                strokeWidth="2"
              />
              <rect
                x="30"
                y="52"
                width="36"
                height="16"
                fill="var(--color-cream)"
                stroke="var(--color-ink)"
                strokeWidth="2"
              />
              <rect
                x="87"
                y="52"
                width="36"
                height="16"
                fill="var(--color-cream)"
                stroke="var(--color-ink)"
                strokeWidth="2"
              />
              <rect
                x="144"
                y="52"
                width="36"
                height="16"
                fill="var(--color-cream)"
                stroke="var(--color-ink)"
                strokeWidth="2"
              />
              <rect
                x="118"
                y="100"
                width="32"
                height="14"
                fill="var(--color-cream)"
                stroke="var(--color-ink)"
                strokeWidth="2"
              />
              <rect
                x="174"
                y="100"
                width="32"
                height="14"
                fill="var(--color-warm)"
                stroke="var(--color-ink)"
                strokeWidth="2"
              />
            </svg>

            <dl className="border-paper-edge mt-3 grid grid-cols-3 gap-1 border-t-2 pt-3">
              <StructureStat value={structureIndex.posities} label="posities" />
              <StructureStat value={structureIndex.mensen} label="mensen" />
              <StructureStat
                value={structureIndex.afdelingen}
                label="afdelingen"
              />
            </dl>
          </TapedCard>
        </div>
      </div>
    </header>
  );
}

function StructureStat({ value, label }: { value: number; label: string }) {
  // `<dt>` precedes `<dd>` for correct `<dl>` semantics; `flex-col-reverse`
  // keeps the value visually above the label.
  return (
    <div className="flex flex-col-reverse gap-1 text-center">
      <dt className="text-ink-muted font-mono text-[8.5px] tracking-[0.06em] uppercase">
        {label}
      </dt>
      <dd className="font-display text-jersey-deep text-[26px] leading-none font-black">
        {value}
      </dd>
    </div>
  );
}

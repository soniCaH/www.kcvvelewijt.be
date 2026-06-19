import { EditorialHeading, TapedCard } from "@/components/design-system";
import { HubSearch } from "../HubSearch";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import type { StructureIndex } from "./structure-index";

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
 * Left: warm kicker · help-forward `<EditorialHeading>` "Waarmee kunnen we je
 * helpen?" (warm "?", 7o9 · 1) · italic lead · the embedded `<HubSearch>` (with
 * an example placeholder that teaches natural-language, 7o9 · 4) · a "blader
 * hieronder" bridge · audience chips → Hulp. Right: a cream taped **structure
 * artefact** — an abstract paper org-tree motif + the derivable structure index.
 */
export function OrganigramHero({
  members,
  responsibilityPaths,
  structureIndex,
  kicker,
  heading = "Waarmee kunnen we je helpen?",
  lead = "Typ je vraag of een naam — wij wijzen je naar het antwoord én de juiste persoon.",
}: OrganigramHeroProps) {
  return (
    <header
      id="hub-hero"
      className="bg-jersey-deep-dark border-ink relative border-2 px-6 py-6 shadow-[6px_6px_0_0_var(--color-ink)] sm:px-9 sm:py-7"
    >
      {/* Radial jersey wash — decorative. `inset-0` keeps it bounded to the
          band without an `overflow-hidden` that would clip the search dropdown. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 72% 0%, color-mix(in srgb, var(--color-jersey-deep) 14%, transparent), transparent 60%)",
        }}
      />

      <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_0.82fr] lg:gap-10">
        {/* Left — voice + search. The audience chips live in the finder only
            (7o9) so they aren't repeated within one viewport. */}
        <div className="flex flex-col gap-4">
          {kicker && (
            <span className="text-warm font-mono text-[12px] font-semibold tracking-[0.18em] uppercase">
              {kicker}
            </span>
          )}

          <EditorialHeading
            level={1}
            size="display-lg"
            tone="cream"
            emphasis={{ text: "?", tone: "warm" }}
            className="mb-0"
          >
            {heading}
          </EditorialHeading>

          <p className="text-cream/80 font-display max-w-[44ch] text-[16px] leading-[1.4] italic">
            {lead}
          </p>

          <div className="flex flex-col gap-2">
            <HubSearch
              members={members}
              responsibilityPaths={responsibilityPaths}
              variant="hero"
              placeholder={'bv. "mijn kind is geblesseerd" of een naam…'}
              className="max-w-[480px]"
            />
            {/* Browse bridge (7o9 · 4) — names the alternative to searching so a
                user who'd rather browse knows the finder is right below. */}
            <a
              href="#hulp"
              className="text-cream/70 hover:text-cream inline-flex w-fit items-center gap-1.5 font-mono text-[11px] tracking-[0.04em] uppercase transition-colors"
            >
              {/* Inline SVG (not @/lib/icons.redesign) — this hero is a server
                  component; Phosphor's createContext can't run server-side. */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 16 5 9h14z" />
              </svg>
              of blader hieronder door de categorieën
            </a>
          </div>
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
            className="w-full max-w-[340px]"
          >
            <p className="text-ink-muted mb-2 text-center font-mono text-[10px] tracking-[0.1em] uppercase">
              De structuur
            </p>

            <svg
              className="mx-auto block h-auto w-full"
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

import type { ReactNode } from "react";
import { EditorialHeading } from "@/components/design-system";

export interface SearchMastheadProps {
  /**
   * The interactive search field rendered inside the band (typically a
   * `<SearchForm>`). Passed as a slot so the masthead stays a presentational,
   * server-renderable shell while the field owns its own client state.
   */
  children: ReactNode;
  /** Display heading. The `accent` substring carries the warm-gold emphasis. */
  heading?: string;
  /** Substring of `heading` rendered in the warm italic accent. */
  accent?: string;
  /**
   * Optional mono hint line below the field. Omitted by default — the `/zoeken`
   * page renders no hint (the pre-search card carries the guidance), so a
   * persistent "Typ minstens 2 letters · …" line under the field read as
   * redundant clutter (owner review #2106).
   */
  hint?: string;
}

/**
 * <SearchMasthead> — the softened-S3 `/zoeken` masthead (design lock 8s1):
 * a `jersey-deep-dark` full-bleed band (diagonal stripe texture + radial jersey
 * wash) wearing the search field as its hero. No mono kicker; a serif
 * `<EditorialHeading>` "Wat _zoek_ je?" with a **warm-gold** accent on "zoek"
 * (jersey-deep is invisible on the dark ground, 8s1.1); an optional mono hint
 * line under the field. Results render on cream below the band (8s2/8s4).
 */
export function SearchMasthead({
  children,
  heading = "Wat zoek je?",
  accent = "zoek",
  hint,
}: SearchMastheadProps) {
  return (
    <header className="bg-jersey-deep-dark border-ink relative overflow-hidden border-b-2">
      {/* Diagonal stripe texture — decorative (8s1). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(135deg, rgba(245,241,230,0.045) 0 18px, transparent 18px 36px)",
        }}
      />
      {/* Radial jersey wash — decorative (8s1). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 18% -10%, rgba(74,207,82,0.14), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-12 md:py-14">
        <EditorialHeading
          level={1}
          size="display-xl"
          tone="cream"
          emphasis={{ text: accent, tone: "warm" }}
          className="mb-6"
        >
          {heading}
        </EditorialHeading>

        {children}

        {hint && (
          <p className="text-cream/70 mt-3.5 font-mono text-[length:var(--text-mono-sm)] tracking-[0.03em]">
            {hint}
          </p>
        )}
      </div>
    </header>
  );
}

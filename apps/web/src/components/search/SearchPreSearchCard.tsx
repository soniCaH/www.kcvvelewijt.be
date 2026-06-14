/**
 * SearchPreSearchCard — the `/zoeken` pre-search state (8s4 E2).
 *
 * Shown while the query is shorter than 2 characters. Deliberately lightweight:
 * the dark masthead already asks the question ("Wat _zoek_ je?"), so this card
 * does NOT restate it — and the redundant "Typ minstens 2 letters · categories"
 * helper line was dropped from the masthead entirely (that triple-repeat was
 * flagged in owner review #2106). Its one job is to give concrete examples of
 * what is searchable — a short helper heading plus three mono paper example
 * chips. Replaces the legacy emoji help block.
 */

import { EditorialHeading } from "@/components/design-system";

const TYPE_HINTS = [
  "Een spelersnaam",
  "Een ploeg",
  "Een nieuwsbericht",
] as const;

/**
 * Pre-search paper card with a helper prompt + example chips (8s4 E2).
 */
export function SearchPreSearchCard() {
  return (
    <section className="border-ink bg-cream-soft shadow-paper-sm border-2 p-7 sm:p-8">
      <EditorialHeading
        level={2}
        size="display-sm"
        emphasis={{ text: "beginnen" }}
      >
        Niet zeker waar te beginnen?
      </EditorialHeading>

      <p className="text-ink-soft mt-3 font-mono text-[11px] font-semibold tracking-[0.13em] uppercase">
        Zoek bijvoorbeeld naar
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {TYPE_HINTS.map((hint) => (
          <span
            key={hint}
            className="border-ink bg-cream text-ink border-[1.5px] px-[11px] py-1.5 font-mono text-[11px] font-semibold tracking-[0.06em] uppercase shadow-[2px_2px_0_0_var(--color-ink)]"
          >
            {hint}
          </span>
        ))}
      </div>
    </section>
  );
}

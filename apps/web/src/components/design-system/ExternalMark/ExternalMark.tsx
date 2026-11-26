import { ArrowSquareOut } from "@/lib/icons.redesign";
import { cn } from "@/lib/utils/cn";

export interface ExternalMarkProps {
  className?: string;
}

/**
 * <ExternalMark> — the one primitive that carries the external-link glyph
 * and its assistive announcement together, per #2547's resolution.
 *
 * - **Glyph:** Phosphor `<ArrowSquareOut>` at `0.75em`, `opacity-60`,
 *   `aria-hidden` — unchanged from what `<ArticleBody>` already shipped
 *   (rule 3). Every other literal arrow character that used to carry this
 *   meaning (`↗`, and the stray `→`s on the ticket-shop and Google Calendar
 *   CTAs) is replaced by this component, not restyled.
 * - **Announcement:** Dutch, and it travels with the glyph, never separately
 *   — `" (opent in een nieuw tabblad)"` (rule 4). If the eye gets the box,
 *   the ear gets the sentence; if there is no box, there is no sentence.
 *
 * Renders inline, immediately after the link's own visible text — it never
 * introduces an accessible name of its own (the `sr-only` text is appended
 * copy, not a label), so it cannot duplicate the link's name into a
 * confusing one.
 *
 * Placement rule (owned by each call site, not this component): a control
 * earns this mark only when the act it performs happens off-site (rule 2).
 * A control whose visible label already names the destination gets nothing
 * at all (rule 1) — delete the mark there rather than reaching for this
 * component.
 */
export const ExternalMark = ({ className }: ExternalMarkProps) => {
  return (
    <>
      <ArrowSquareOut
        aria-hidden="true"
        className={cn(
          "ml-0.5 inline-block align-baseline opacity-60",
          className,
        )}
        size="0.75em"
      />
      <span className="sr-only"> (opent in een nieuw tabblad)</span>
    </>
  );
};

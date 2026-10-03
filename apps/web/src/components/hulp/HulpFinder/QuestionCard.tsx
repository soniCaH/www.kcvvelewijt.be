"use client";

/**
 * QuestionCard — one question in the finder, as a **single-open inline
 * accordion** (7o6c · 2). Collapsed: a full-row toggle (category glyph stamp ·
 * question · caret). Open: summary · numbered steps (with optional inline links)
 * · the person-vocab `<ContactCard>`. Open/close state is owned by `<HulpFinder>`
 * (single-open); this card is presentational + accessible.
 *
 * The answer stays mounted while closed so it can shrink away (#3398): a
 * `<HeightGrow>` row transition, Arrival speed, so the closing and the opening
 * answer move together. Closed, it is `inert`: out of the tab order and the
 * accessibility tree.
 *
 * A11y: the header is a heading-wrapped `<button>` with `aria-expanded` /
 * `aria-controls`; the panel is a `region` labelled by the header. The whole row
 * is the tap target. Press-down hover only while collapsed.
 */

import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type TransitionEvent,
} from "react";
import { CaretDown } from "@/lib/icons.redesign";
import type { ResponsibilityPath } from "@/types/responsibility";
import { ACCENT_GLYPH_CLASS, CATEGORY_META } from "./categoryMeta";
import { ContactCard } from "./ContactCard";
import { resolveContact } from "./resolveContact";
import { PRESS_DOWN_TRANSITION } from "@/components/design-system/press-down";
import { HeightGrow } from "@/components/design-system/HeightGrow";
import { scrollIntoViewMotionSafe } from "@/lib/utils/scroll-into-view";

/**
 * Scroll-back guard (#3398): a tall answer closing above this card can leave
 * its header off the top, so once the heights have settled, bring it back just
 * under the sticky bar. The bar's height is `scroll-padding-top` on `<html>`
 * (DESIGN.md → The Derived Anchor Offset Rule), which `scrollIntoView` also
 * honours. Most taps never trigger it.
 */
function showHeaderIfAbove(card: HTMLElement) {
  const offset =
    parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) ||
    0;
  if (card.getBoundingClientRect().top < offset) {
    scrollIntoViewMotionSafe(card, { block: "start" });
  }
}

export interface QuestionCardProps {
  path: ResponsibilityPath;
  /** Whether this card's answer is expanded (single-open, owned by the finder). */
  open: boolean;
  onToggle: () => void;
  onContactClick?: (channel: "email" | "phone") => void;
  onStepLinkClick?: (stepIndex: number) => void;
  onShowInStructure?: (
    event: MouseEvent<HTMLAnchorElement>,
    nodeId: string,
  ) => void;
}

export function QuestionCard({
  path,
  open,
  onToggle,
  onContactClick,
  onStepLinkClick,
  onShowInStructure,
}: QuestionCardProps) {
  const meta = CATEGORY_META[path.category];
  const Icon = meta.icon;
  const baseId = useId();
  const headerId = `${baseId}-header`;
  const panelId = `${baseId}-panel`;
  const contact = resolveContact(path.primaryContact);
  const cardRef = useRef<HTMLDivElement>(null);

  // Under reduced motion no transition runs, so no `transitionend` comes: the
  // height is already final once the open has rendered. A card that mounts
  // open (a story) is not an open.
  const wasOpen = useRef(open);
  useEffect(() => {
    if (
      open &&
      !wasOpen.current &&
      cardRef.current &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      showHeaderIfAbove(cardRef.current);
    }
    wasOpen.current = open;
  }, [open]);

  // Only this card's own height transition, and only the opening one: the
  // closing answer settles to zero without a say in where the header is.
  const handleHeightEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (
      open &&
      event.target === event.currentTarget &&
      event.propertyName === "grid-template-rows" &&
      cardRef.current
    ) {
      showHeaderIfAbove(cardRef.current);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`border-ink bg-cream border-2 shadow-[3px_3px_0_0_var(--color-ink)] ${
        open
          ? ""
          : `${PRESS_DOWN_TRANSITION} hover:translate-x-1 hover:translate-y-1 hover:shadow-none`
      }`}
    >
      <h3>
        <button
          type="button"
          id={headerId}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 p-3 text-left"
        >
          <span
            aria-hidden
            className={`border-ink bg-cream-soft flex h-8 w-8 flex-shrink-0 items-center justify-center border-[1.5px] ${ACCENT_GLYPH_CLASS[meta.accent]}`}
          >
            <Icon size={16} />
          </span>
          <span className="font-display text-ink flex-1 text-[16px] leading-snug font-semibold italic">
            {path.question}
          </span>
          <CaretDown
            size={18}
            aria-hidden
            className={`flex-shrink-0 transition-transform duration-150 ${
              open ? "text-jersey-deep rotate-180" : "text-ink-muted"
            }`}
          />
        </button>
      </h3>

      <HeightGrow open={open} bleed={false} onTransitionEnd={handleHeightEnd}>
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          inert={!open}
          className="border-paper-edge border-t-2 border-dashed p-4"
        >
          <p className="text-ink mb-3 text-[14px] leading-relaxed">
            {path.summary}
          </p>

          {path.steps.length > 0 && (
            <ol className="mb-4 space-y-2">
              {path.steps.map((step, i) => {
                // Only allow http(s) or absolute-path links; drop unsafe
                // schemes (javascript:, data:, …) even from CMS-authored steps.
                const safeLink =
                  step.link && /^(https?:\/\/|\/)/i.test(step.link)
                    ? step.link
                    : undefined;
                const external = safeLink?.startsWith("http") ?? false;
                return (
                  <li
                    key={i}
                    className="border-paper-edge flex gap-3 border-b border-dotted pb-2 last:border-b-0"
                  >
                    <span
                      aria-hidden
                      className="border-ink bg-jersey-deep text-cream flex h-5 w-5 flex-shrink-0 items-center justify-center border-[1.5px] font-mono text-[10px]"
                    >
                      {i + 1}
                    </span>
                    <span className="text-ink text-body-sm pt-px">
                      {step.description}
                      {safeLink && (
                        <>
                          {" "}
                          <a
                            href={safeLink}
                            onClick={() => onStepLinkClick?.(i)}
                            target={external ? "_blank" : undefined}
                            rel={external ? "noopener noreferrer" : undefined}
                            className="text-jersey-deep hover:text-jersey-deep-dark font-semibold underline"
                          >
                            Meer info
                          </a>
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <ContactCard
            contact={contact}
            onContactClick={onContactClick}
            onShowInStructure={onShowInStructure}
          />
        </div>
      </HeightGrow>
    </div>
  );
}

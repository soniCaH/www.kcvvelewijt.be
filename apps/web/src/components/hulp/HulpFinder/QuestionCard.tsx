"use client";

/**
 * QuestionCard — one question in the finder, as a **single-open inline
 * accordion** (7o6c · 2). Collapsed: a full-row toggle (category glyph stamp ·
 * question · caret). Open: summary · numbered steps (with optional inline links)
 * · the person-vocab `<ContactCard>`. Open/close state is owned by `<HulpFinder>`
 * (single-open); this card is presentational + accessible.
 *
 * A11y: the header is a heading-wrapped `<button>` with `aria-expanded` /
 * `aria-controls`; the panel is a `region` labelled by the header. The whole row
 * is the tap target. Press-down hover only while collapsed.
 */

import { useId, type MouseEvent } from "react";
import { CaretDown } from "@/lib/icons.redesign";
import type { ResponsibilityPath } from "@/types/responsibility";
import { ACCENT_GLYPH_CLASS, CATEGORY_META } from "./categoryMeta";
import { ContactCard } from "./ContactCard";
import { resolveContact } from "./resolveContact";

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

  return (
    <div
      className={`border-ink bg-cream border-2 shadow-[3px_3px_0_0_var(--color-ink)] ${
        open
          ? ""
          : "transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
      }`}
    >
      <h3 className="mb-0!">
        <button
          type="button"
          id={headerId}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
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
            className={`flex-shrink-0 transition-transform duration-200 ${
              open ? "text-jersey-deep rotate-180" : "text-ink-muted"
            }`}
          />
        </button>
      </h3>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="border-paper-edge border-t-2 border-dashed p-4"
        >
          <p className="text-ink-soft mb-3 text-[14px] leading-relaxed">
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
                    <span className="text-ink pt-px text-[13px] leading-relaxed">
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
      )}
    </div>
  );
}

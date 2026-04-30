"use client";

/**
 * AlertBadge — primary inline alert.
 *
 * Direction E ("Angled badge + italic Freight Display message") locked at
 * the Phase 2.A.5 design checkpoint (2026-04-30). Source-of-record:
 * `docs/design/mockups/phase-2-a-5-alert/option-e-angled-badge.html` and
 * `docs/prd/redesign-phase-2.md` §6.4.A.
 *
 * Two-form Alert API: this is the inline form. Use `<AlertBadge>` for
 * form-field validation, short single-headline confirmations, and form
 * summaries (one badge under the form with a multi-line message). Use
 * the long-form `<Alert>` (ticket-stub vocabulary, sibling file) when you
 * need a title, multi-paragraph body, or a dismissible close button —
 * AlertBadge is non-dismissible by design.
 *
 * Layout: an `inline-flex` row holding an angled colour-filled badge on
 * the left and an italic Freight Display message to the right. No card
 * body, no soft-tinted bg — the page colour shows through. The badge is
 * `border-2 ink` + small offset shadow + sub-degree rotation for the
 * hand-stamped feel; the message echoes the variant accent colour for
 * emphasis. Multi-line messages keep all wrapped lines aligned to the
 * same x-edge as line 1 (badge-right + gap); the badge stays anchored
 * to line 1 via `items-start`.
 */

import { forwardRef, type ReactNode } from "react";
import { CheckCircle, Warning, WarningCircle } from "@/lib/icons.redesign";
import { cn } from "@/lib/utils/cn";

export type AlertBadgeVariant = "success" | "warning" | "error";

export interface AlertBadgeProps {
  /**
   * Visual variant — controls badge colour, icon, and message accent.
   * Required (no default) so callers think about which one applies.
   */
  variant: AlertBadgeVariant;
  /**
   * Message text. Single-line typical; multi-line allowed for form
   * summaries.
   */
  children: ReactNode;
  /**
   * Additional CSS classes applied to the outer container.
   */
  className?: string;
}

const variantConfig: Record<
  AlertBadgeVariant,
  {
    badge: string;
    message: string;
    label: string;
    Icon: typeof CheckCircle;
    /** WAI-ARIA role + live-region politeness. Errors are assertive; */
    /** success/warning are polite (status), avoiding interruption. */
    role: "alert" | "status";
    ariaLive: "assertive" | "polite";
  }
> = {
  success: {
    badge: "bg-jersey-deep text-cream",
    message: "text-jersey-deep",
    label: "MELDING",
    Icon: CheckCircle,
    role: "status",
    ariaLive: "polite",
  },
  warning: {
    badge: "bg-warning text-cream",
    message: "text-warning",
    label: "WAARSCHUWING",
    Icon: Warning,
    role: "status",
    ariaLive: "polite",
  },
  error: {
    badge: "bg-alert text-cream",
    message: "text-alert",
    label: "FOUT",
    Icon: WarningCircle,
    role: "alert",
    ariaLive: "assertive",
  },
};

/**
 * AlertBadge — angled badge + italic message.
 *
 * @example
 * ```tsx
 * <AlertBadge variant="error">Geen geldig telefoonnummer.</AlertBadge>
 *
 * <AlertBadge variant="success">
 *   Je bericht is verzonden — we nemen binnen 2 werkdagen contact met je op.
 * </AlertBadge>
 * ```
 */
export const AlertBadge = forwardRef<HTMLDivElement, AlertBadgeProps>(
  function AlertBadge({ variant, children, className }, ref) {
    const config = variantConfig[variant];
    const { Icon } = config;

    return (
      <div
        ref={ref}
        role={config.role}
        aria-live={config.ariaLive}
        className={cn(
          "inline-flex max-w-[640px] items-start gap-[18px] py-2 pr-1",
          className,
        )}
      >
        <span
          className={cn(
            "mt-[2px] inline-flex flex-shrink-0 items-center gap-2",
            "border-ink rounded-none border-2",
            "shadow-[3px_3px_0_0_var(--color-ink)]",
            "px-3 py-[6px]",
            "font-mono text-[11px] font-bold tracking-[0.12em] uppercase",
            "leading-none whitespace-nowrap",
            "-rotate-2",
            config.badge,
          )}
        >
          <Icon size={12} aria-hidden="true" />
          <span>{config.label}</span>
        </span>
        <span
          className={cn(
            "font-display text-[22px] leading-[1.25] font-normal italic",
            config.message,
          )}
        >
          {children}
        </span>
      </div>
    );
  },
);

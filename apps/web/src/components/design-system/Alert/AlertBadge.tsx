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
 *
 * Size variants:
 * - `md` (default): standalone alert moments — form summaries, page
 *   confirmations. 22px italic message, `border-2`, `-rotate-2`,
 *   `tracking-[0.12em]`. Phase 2.A.5 source idiom.
 * - `sm`: inline form-row helper text under Input/Select/Textarea. 15px
 *   italic message, `border-[1.5px]`, no rotation, `tracking-[0.08em]`.
 *   Phase 2.A.4 form-atom idiom — the FOUT pill that follows a single
 *   field instead of a whole form summary.
 */

import { forwardRef, type ReactNode } from "react";
import { CheckCircle, Warning, WarningCircle } from "@/lib/icons.redesign";
import { cn } from "@/lib/utils/cn";

export type AlertBadgeVariant = "success" | "warning" | "error";
export type AlertBadgeSize = "sm" | "md";

export interface AlertBadgeProps {
  /**
   * Visual variant — controls badge colour, icon, and message accent.
   * Required (no default) so callers think about which one applies.
   */
  variant: AlertBadgeVariant;
  /**
   * Visual scale.
   * - `md` (default) for standalone moments / form summaries.
   * - `sm` for inline form-row helper text under a single field.
   * @default "md"
   */
  size?: AlertBadgeSize;
  /**
   * Optional id for `aria-describedby` association — used by form
   * fields that point at the alert with their `aria-describedby`.
   */
  id?: string;
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

const sizeConfig: Record<
  AlertBadgeSize,
  {
    container: string;
    badge: string;
    iconPx: number;
    message: string;
  }
> = {
  md: {
    container: "gap-[18px] py-2 pr-1",
    badge: cn(
      "border-2 px-3 py-[6px]",
      "shadow-[3px_3px_0_0_var(--color-ink)]",
      "text-[11px] tracking-[0.12em]",
      "-rotate-2",
    ),
    iconPx: 12,
    message: "text-[22px] leading-[1.25]",
  },
  sm: {
    container: "gap-3 py-1",
    badge: cn(
      "border-[1.5px] px-2 py-[3px]",
      "shadow-[3px_3px_0_0_var(--color-ink)]",
      "text-[11px] tracking-[0.08em]",
      // Subtler tilt than md's -rotate-2 — keeps the hand-stamped vocabulary
      // visible in tight form-row context without dominating the field.
      "-rotate-1",
    ),
    iconPx: 12,
    message: "text-[15px] leading-snug",
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
 *
 * // Inline under a form field
 * <AlertBadge variant="error" size="sm" id={helperId}>
 *   Vul een geldig e-mailadres in.
 * </AlertBadge>
 * ```
 */
export const AlertBadge = forwardRef<HTMLDivElement, AlertBadgeProps>(
  function AlertBadge({ variant, size = "md", id, children, className }, ref) {
    const config = variantConfig[variant];
    const sz = sizeConfig[size];
    const { Icon } = config;

    return (
      <div
        ref={ref}
        id={id}
        role={config.role}
        aria-live={config.ariaLive}
        data-size={size}
        className={cn(
          "inline-flex max-w-[640px] items-start",
          sz.container,
          className,
        )}
      >
        <span
          className={cn(
            "mt-[2px] inline-flex flex-shrink-0 items-center gap-2",
            "border-ink rounded-none",
            "font-mono font-bold uppercase",
            "leading-none whitespace-nowrap",
            sz.badge,
            config.badge,
          )}
        >
          <Icon size={sz.iconPx} aria-hidden="true" />
          <span>{config.label}</span>
        </span>
        <span
          className={cn(
            "font-display font-normal italic",
            sz.message,
            config.message,
          )}
        >
          {children}
        </span>
      </div>
    );
  },
);

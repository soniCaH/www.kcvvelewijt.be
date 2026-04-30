"use client";

/**
 * Alert — long-form ticket-stub alert.
 *
 * Direction B ("Ticket Stub — torn from a programme") locked at the
 * Phase 2.A.5 design checkpoint (2026-04-30). Source-of-record:
 * `docs/design/mockups/phase-2-a-5-alert/option-b-ticket-stub.html` and
 * `docs/prd/redesign-phase-2.md` §6.4.B.
 *
 * Two-form Alert API: this is the long-form companion. Use `<Alert>` for
 * page-level / dashboard-level alerts that need a title, multi-paragraph
 * body, and/or a dismiss button. Use `<AlertBadge>` (sibling file) for
 * inline form-field validation, short single-headline confirmations, and
 * one-badge-per-form-summary multi-line messages.
 *
 * Visual: a paper-card outer (`border-2 border-ink` + `--shadow-paper-sm`)
 * with a perforated left "stub" column. The stub holds a coloured icon
 * block; the body holds a mono caps kicker label, italic Freight Display
 * title, and an ink Inter body. Sharp corners; `<Alert>` overrides text
 * colour explicitly inside `panel--dusk` contexts so the tinted body
 * stays legible regardless of the surrounding theme.
 */

import { forwardRef, type ReactNode } from "react";
import { CheckCircle, Warning, WarningCircle, X } from "@/lib/icons.redesign";
import { cn } from "@/lib/utils/cn";

export type AlertVariant = "success" | "warning" | "error";

export interface AlertProps {
  /**
   * Visual variant — controls icon block colour, body tint, and kicker.
   * @default 'success'
   */
  variant?: AlertVariant;
  /**
   * Optional bold italic title displayed above the body.
   */
  title?: string;
  /**
   * Alert body content.
   */
  children: ReactNode;
  /**
   * Show a close button (caller is responsible for hiding the alert).
   * @default false
   */
  dismissible?: boolean;
  /**
   * Callback fired when the close button is clicked.
   */
  onDismiss?: () => void;
  /**
   * Additional CSS classes applied to the outer card.
   */
  className?: string;
}

const variantConfig: Record<
  AlertVariant,
  {
    bg: string;
    iconBlock: string;
    kicker: string;
    kickerLabel: string;
    Icon: typeof CheckCircle;
    /** WAI-ARIA role + live-region politeness. Errors are assertive; */
    /** success/warning are polite (status), avoiding interruption. */
    role: "alert" | "status";
    ariaLive: "assertive" | "polite";
  }
> = {
  success: {
    bg: "bg-success-soft",
    iconBlock: "bg-jersey-deep text-cream",
    kicker: "text-jersey-deep",
    kickerLabel: "★ MELDING",
    Icon: CheckCircle,
    role: "status",
    ariaLive: "polite",
  },
  warning: {
    bg: "bg-warning-soft",
    iconBlock: "bg-warning text-cream",
    kicker: "text-warning",
    kickerLabel: "⚠ WAARSCHUWING",
    Icon: Warning,
    role: "status",
    ariaLive: "polite",
  },
  error: {
    bg: "bg-alert-soft",
    iconBlock: "bg-alert text-cream",
    kicker: "text-alert",
    kickerLabel: "! FOUT",
    Icon: WarningCircle,
    role: "alert",
    ariaLive: "assertive",
  },
};

/**
 * Alert — long-form ticket-stub alert.
 *
 * @example
 * ```tsx
 * <Alert variant="success" title="Verzonden!">
 *   Je bericht is succesvol verstuurd.
 * </Alert>
 *
 * <Alert variant="error" title="Fout" dismissible onDismiss={() => setOpen(false)}>
 *   Er ging iets mis. Controleer je gegevens en probeer opnieuw.
 * </Alert>
 * ```
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    variant = "success",
    title,
    children,
    dismissible = false,
    onDismiss,
    className,
  },
  ref,
) {
  const config = variantConfig[variant];
  const { Icon } = config;

  return (
    <div
      ref={ref}
      role={config.role}
      aria-live={config.ariaLive}
      className={cn(
        "relative grid grid-cols-[72px_1fr] items-stretch overflow-hidden",
        "border-ink rounded-none border-2",
        "shadow-[var(--shadow-paper-sm)]",
        config.bg,
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          // pt-4 matches the body's py-4 so the icon top aligns with the
          // kicker text top, not the geometric centre of the card. This
          // keeps the icon anchored to "top text" on multi-paragraph
          // bodies — owner feedback 2026-04-30.
          "kcvv-stub-notch flex items-start justify-center pt-4",
          config.bg,
        )}
      >
        <span
          className={cn(
            "relative z-10 inline-flex h-10 w-10 items-center justify-center",
            config.iconBlock,
          )}
        >
          <Icon size={22} aria-hidden="true" />
        </span>
      </div>

      <div className="relative px-5 py-4">
        {dismissible && (
          <button
            type="button"
            onClick={() => onDismiss?.()}
            aria-label="Sluit melding"
            className={cn(
              "absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center",
              "rounded p-0.5 transition-colors",
              "text-ink/60 hover:text-ink hover:bg-ink/5",
              "focus-visible:ring-jersey-deep focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            )}
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}

        <span
          className={cn(
            "block font-mono text-[10px] font-semibold tracking-[0.12em] uppercase",
            config.kicker,
          )}
        >
          {config.kickerLabel}
        </span>

        {title && (
          <h3 className="font-display text-ink mt-0.5 text-[22px] leading-[1.15] font-bold italic">
            {title}
          </h3>
        )}

        <div className="text-ink mt-1 text-[15px] leading-[1.55]">
          {children}
        </div>
      </div>
    </div>
  );
});

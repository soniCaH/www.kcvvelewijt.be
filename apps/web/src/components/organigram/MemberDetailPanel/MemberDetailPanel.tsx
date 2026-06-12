"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import Image from "next/image";
import Link from "next/link";
import type { OrgChartMember, OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import { cn } from "@/lib/utils/cn";
import { findMemberResponsibilities } from "@/lib/responsibility-utils";
import {
  monogramInitials,
  splitDisplayName,
} from "@/components/organigram/OrgPersonCard";
import { ArrowRight, Envelope, Phone, X } from "@/lib/icons.redesign";

/**
 * `<MemberDetailPanel>` — the Phase 7 `/hulp` person-first contact detail (design
 * lock `7o5`). Clicking a directory card or an explorer leaf opens a **person's
 * contact** — never a function summary — in a right side-panel (desktop) that
 * degrades to a full-width bottom sheet on mobile, so the directory/explorer
 * stays visible and the panel just updates as you click around.
 *
 *  - **single** — opens that holder directly.
 *  - **shared** — lands on holder #1 with a real `role="tablist"` holder-switcher
 *    (first-name tabs) to flip to co-holders; the dialog name + analytics + the
 *    `?member=` deep-link all track the **selected** holder.
 *  - **vacant** — the carve-out: no person, so no contact actions / no switcher /
 *    no "Volledig profiel" — just the position + "deze plek is vrij" + the 7o4
 *    recruit CTA.
 *
 * Replaces both the retired center `<MemberDetailsModal>` and the never-built
 * `<ContactOverlay>` — one person-first surface for every entry point.
 */

export interface MemberDetailPanelProps {
  /** The position to show. `null` (with `open`) renders nothing. */
  node: OrgChartNode | null;
  open: boolean;
  onClose: () => void;
  /** Responsibility paths — resolve the holder's "Helpt met" chips. */
  responsibilityPaths?: ResponsibilityPath[];
  /** Holder to select on open (deep-link restore); falls back to holder #1. */
  initialHolderId?: string;
  /** Element focus returns to on close (typically the launcher). */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** Where the vacant recruit CTA points. Default `/club/contact`. */
  vacantCtaHref?: string;
  /**
   * Fired on open and again on every holder switch (and a fresh node). The host
   * uses it to fire `organigram_member_clicked` (hashed selected holder) and to
   * sync the `?member=` deep-link. `holder` is `null` for a vacant position.
   */
  onMemberShown?: (node: OrgChartNode, holder: OrgChartMember | null) => void;
}

const DEPARTMENT_LABEL: Record<string, string> = {
  hoofdbestuur: "Hoofdbestuur",
  jeugdbestuur: "Jeugdbestuur",
  algemeen: "Algemeen",
};

/** afdeling · functie kicker, dropping the afdeling when unknown. */
function deriveKicker(node: OrgChartNode): string {
  const dept = node.department ? DEPARTMENT_LABEL[node.department] : undefined;
  return [dept, node.title].filter(Boolean).join(" · ");
}

/**
 * Harden a contact value before it goes into a `mailto:`/`tel:` href: trim and
 * strip control characters (incl. CR/LF) so a malformed value can't inject extra
 * mailto headers or break the URI. Full `encodeURIComponent` is intentionally
 * avoided — it would mangle the `@`/`+`/spaces these schemes legitimately use,
 * and the data is editor-managed staff data, not anonymous user input. Returns
 * "" when nothing usable remains (the action then doesn't render).
 */
function sanitizeContactValue(value: string | undefined): string {
  return Array.from(value ?? "")
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code > 0x1f && code !== 0x7f;
    })
    .join("")
    .trim();
}

const FOCUSABLE =
  'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function MemberDetailPanel({
  node,
  open,
  onClose,
  responsibilityPaths = [],
  initialHolderId,
  returnFocusRef,
  vacantCtaHref = "/club/contact",
  onMemberShown,
}: MemberDetailPanelProps) {
  const baseId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Selected holder for a shared position. `null` → fall back to the resolved
  // initial holder. Reset synchronously (no flash) when the shown node changes,
  // so every fresh open lands on holder #1 (7o5). The host clears `node` on
  // close (`HubMemberPanel`), so reopening the same position is a node change
  // too — the user never resumes on the holder they last switched to.
  const [selectedHolderId, setSelectedHolderId] = useState<string | null>(null);
  const prevNodeIdRef = useRef(node?.id);
  if (prevNodeIdRef.current !== node?.id) {
    prevNodeIdRef.current = node?.id;
    setSelectedHolderId(null);
  }

  const members = node?.members ?? [];
  const resolvedInitial =
    (initialHolderId && members.some((m) => m.id === initialHolderId)
      ? initialHolderId
      : undefined) ?? members[0]?.id;
  const activeHolderId =
    selectedHolderId && members.some((m) => m.id === selectedHolderId)
      ? selectedHolderId
      : resolvedInitial;
  const activeHolder = members.find((m) => m.id === activeHolderId) ?? null;
  const activeName = activeHolder?.name?.trim() || node?.title || "";

  // Emit "shown" on open and on every (node, holder) change. A ref keeps the
  // latest callback out of the deps so a new function identity from the parent
  // never re-fires the event. The sync effect is declared first so it commits
  // the fresh callback before the emit effect below reads it.
  const shownCbRef = useRef(onMemberShown);
  useEffect(() => {
    shownCbRef.current = onMemberShown;
  });
  useEffect(() => {
    if (!open || !node) return;
    shownCbRef.current?.(node, activeHolder ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, node?.id, activeHolderId]);

  // Move focus into the panel on open; restore it to the launcher on close.
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) returnFocusRef?.current?.focus();
    wasOpen.current = open;
  }, [open, returnFocusRef]);

  // Lock the background scroll while the panel is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || !node) return null;

  const isVacant = members.length === 0;
  const isShared = members.length >= 2;
  const holderResponsibilities =
    activeHolder && responsibilityPaths.length > 0
      ? findMemberResponsibilities(activeHolder.id, responsibilityPaths)
      : [];

  // Hardened before embedding in the mailto:/tel: hrefs (and the action only
  // renders when a usable value survives).
  const mailValue = sanitizeContactValue(activeHolder?.email);
  const telValue = sanitizeContactValue(activeHolder?.phone);

  const tabId = (holderId: string) => `${baseId}-tab-${holderId}`;
  const panelId = `${baseId}-panel`;

  const onContainerKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    // Keep only actually-tabbable elements — the roving holder-switcher leaves
    // inactive tabs as `tabIndex={-1}` buttons, which the selector would
    // otherwise treat as trap boundaries.
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => el.tabIndex >= 0);
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-stretch sm:justify-end"
      onKeyDown={onContainerKeyDown}
      data-testid="member-detail-panel-overlay"
    >
      {/* Backdrop — closes on click (7o5: ✕ / backdrop / Esc). Dims the mobile
          bottom-sheet, but stays transparent on desktop so the directory/verkenner
          remains fully visible beside the side panel (7o5 mockup B). Excluded
          from the focus trap (outside the panel). */}
      <button
        type="button"
        aria-label="Paneel achtergrond"
        tabIndex={-1}
        onClick={onClose}
        className="bg-ink/40 absolute inset-0 cursor-default sm:bg-transparent"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Contactgegevens — ${activeName}`}
        data-testid="member-detail-panel"
        className={cn(
          "border-ink bg-cream relative flex max-h-[88vh] w-full flex-col overflow-y-auto border-2 shadow-[0_-6px_0_0_var(--color-ink)]",
          "sm:h-full sm:max-h-none sm:w-[380px] sm:max-w-[88vw] sm:border-l-2 sm:shadow-[-6px_0_0_0_var(--color-ink)]",
        )}
      >
        {/* Shared: holder-switcher above the header (lands on holder #1). */}
        {isShared && (
          <HolderSwitcher
            holders={members}
            activeId={activeHolderId}
            onSelect={setSelectedHolderId}
            tabId={tabId}
            panelId={panelId}
          />
        )}

        <div
          {...(isShared
            ? {
                role: "tabpanel",
                id: panelId,
                "aria-labelledby": activeHolderId
                  ? tabId(activeHolderId)
                  : undefined,
              }
            : {})}
        >
          {/* Header */}
          <div className="bg-jersey-deep-dark text-cream relative px-4 py-4">
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Sluiten"
              className="border-cream/50 text-cream hover:border-cream absolute top-3 right-3 border-[1.5px] px-1.5 py-0.5"
            >
              <X size={12} aria-hidden />
            </button>

            <p className="text-warm font-mono text-[10px] tracking-[0.1em] uppercase">
              {deriveKicker(node)}
            </p>

            <div className="mt-2.5 flex items-center gap-3">
              <HeaderAvatar
                isVacant={isVacant}
                name={activeName}
                imageUrl={activeHolder?.imageUrl}
              />
              <div className="min-w-0">
                <p className="font-display text-[23px] leading-none font-black italic">
                  {isVacant ? node.title : activeName}
                </p>
                {(isVacant || node.roleCode) && (
                  <p className="mt-1.5 flex items-center gap-1.5">
                    {isVacant && (
                      <span className="text-cream/85 font-mono text-[9px] tracking-[0.04em] uppercase">
                        Vacante functie
                      </span>
                    )}
                    {node.roleCode && (
                      <span className="border-ink bg-warm text-ink border-[1.5px] px-1.5 py-px font-mono text-[8px] font-semibold tracking-[0.05em] uppercase">
                        {node.roleCode}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-4 px-4 py-4">
            {isVacant ? (
              <>
                <p className="text-ink-soft text-sm leading-relaxed">
                  Deze plek is vrij — misschien iets voor jou?
                </p>
                <Link
                  href={vacantCtaHref}
                  className="border-ink bg-warm text-ink shadow-paper-sm inline-flex items-center gap-2 self-start border-2 px-4 py-2.5 font-mono text-xs font-bold tracking-[0.04em] uppercase transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                >
                  Iets voor jou?
                  <ArrowRight size={13} aria-hidden />
                </Link>
              </>
            ) : (
              <>
                {(mailValue || telValue) && (
                  <div className="flex gap-2.5">
                    {mailValue && (
                      <ContactAction
                        kind="mail"
                        href={`mailto:${mailValue}`}
                        label="Mail"
                      />
                    )}
                    {telValue && (
                      <ContactAction
                        kind="phone"
                        href={`tel:${telValue}`}
                        label="Bel"
                      />
                    )}
                  </div>
                )}

                {holderResponsibilities.length > 0 && (
                  <div>
                    <p className="text-ink-muted mb-2 font-mono text-[10px] tracking-[0.1em] uppercase">
                      Helpt met
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {holderResponsibilities.map((path) => (
                        <li key={path.id}>
                          {/* Deep-link the question's slug (7o9 / F10) + close the
                              panel, so the finder's hashchange `reveal()` opens
                              that exact answer in view — not just scroll to #hulp. */}
                          <Link
                            href={`#${path.id}`}
                            onClick={onClose}
                            className="border-jersey-deep text-jersey-deep hover:bg-jersey-deep hover:text-cream inline-block border-[1.5px] px-2 py-1 font-mono text-[10px] tracking-[0.02em] uppercase transition-colors"
                          >
                            {path.question}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeHolder?.href && (
                  <Link
                    href={activeHolder.href}
                    className="border-ink bg-cream text-ink shadow-paper-sm inline-flex items-center gap-2 self-start border-2 px-3 py-2 font-mono text-[11px] font-bold tracking-[0.04em] uppercase transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                  >
                    Volledig profiel
                    <ArrowRight size={12} aria-hidden />
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const AVATAR_RING =
  "border-ink bg-cream-soft flex h-[54px] w-[54px] flex-none items-center justify-center overflow-hidden rounded-full border-2";

function HeaderAvatar({
  isVacant,
  name,
  imageUrl,
}: {
  isVacant: boolean;
  name: string;
  imageUrl?: string;
}) {
  if (isVacant) {
    return (
      <div className={cn(AVATAR_RING, "border-dashed")}>
        <span
          aria-hidden="true"
          className="text-jersey-deep font-display-big text-xl font-black italic"
        >
          +
        </span>
      </div>
    );
  }
  const src = imageUrl?.trim() ?? "";
  return (
    <div className={AVATAR_RING}>
      {src !== "" ? (
        <Image
          src={src}
          alt={name}
          width={54}
          height={54}
          unoptimized
          className="h-full w-full object-cover"
          style={{ filter: "var(--filter-photo-newsprint)" }}
        />
      ) : (
        <span
          aria-hidden="true"
          className="text-jersey-deep font-display-big text-xl font-black"
        >
          {monogramInitials(name)}
        </span>
      )}
    </div>
  );
}

function ContactAction({
  kind,
  href,
  label,
}: {
  kind: "mail" | "phone";
  href: string;
  label: string;
}) {
  const Icon = kind === "mail" ? Envelope : Phone;
  return (
    <a
      href={href}
      className="border-ink bg-cream-soft text-ink shadow-paper-sm flex flex-1 items-center justify-center gap-2 border-2 px-3 py-2.5 font-mono text-xs font-semibold tracking-[0.04em] uppercase transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
    >
      <Icon size={14} aria-hidden />
      {label}
    </a>
  );
}

function HolderSwitcher({
  holders,
  activeId,
  onSelect,
  tabId,
  panelId,
}: {
  holders: OrgChartMember[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
  tabId: (holderId: string) => string;
  panelId: string;
}) {
  const tablistRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const index = holders.findIndex((h) => h.id === activeId);
    if (index < 0) return;
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = (index + 1) % holders.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = (index - 1 + holders.length) % holders.length;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = holders.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const target = holders[next]!;
    onSelect(target.id);
    tablistRef.current
      ?.querySelector<HTMLElement>(`#${CSS.escape(tabId(target.id))}`)
      ?.focus();
  };

  return (
    <div className="bg-cream-deep border-ink border-b-2 px-3 py-2.5">
      <p className="text-ink-muted mb-2 font-mono text-[9px] tracking-[0.08em] uppercase">
        Gedeelde functie · {holders.length} personen — kies wie:
      </p>
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="Personen in deze functie"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-1.5"
      >
        {holders.map((holder) => {
          const active = holder.id === activeId;
          const first = splitDisplayName(holder.name ?? "").lead || "—";
          return (
            <button
              key={holder.id}
              id={tabId(holder.id)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(holder.id)}
              className={cn(
                "border-ink flex items-center gap-1.5 border-[1.5px] py-1 pr-2.5 pl-1 font-sans text-xs transition-all",
                active
                  ? "bg-jersey-deep text-cream shadow-[2px_2px_0_0_var(--color-ink)]"
                  : "bg-cream text-ink hover:translate-x-px hover:translate-y-px",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "border-ink font-display-big flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] text-[10px] font-black",
                  active
                    ? "bg-cream text-jersey-deep"
                    : "bg-cream-soft text-jersey-deep",
                )}
              >
                {monogramInitials(holder.name)}
              </span>
              {first}
            </button>
          );
        })}
      </div>
    </div>
  );
}

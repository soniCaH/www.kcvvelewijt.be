"use client";

/**
 * ContactCard — the finder's single contact, in the locked **person vocabulary**
 * (7o6c · 4 / reuses the 6.C `<TeamStaff>` idiom): jersey-deep monogram · name
 * first-semibold + last-italic · mono function label · tappable ✉/☎ (only when
 * present). A `position` contact also gets a **"Toon in structuur →"** cross-link
 * that opens the `<MemberDetailPanel>` (handled by the finder via
 * `useHubMemberPanel()`); `team-role` gets a plain "Vind je ploeg →" link.
 *
 * Responsibility contacts carry no photo (the `Contact` member shape is
 * `{ id, name, email?, phone? }`), so the avatar is monogram-only — the common
 * case for KCVV people regardless.
 */

import Link from "next/link";
import type { MouseEvent } from "react";
import {
  ArrowRight,
  Envelope,
  Phone,
  TreeStructure,
} from "@/lib/icons.redesign";
import {
  monogramInitials,
  splitDisplayName,
} from "@/components/organigram/OrgPersonCard";
import type { ResolvedContact } from "./resolveContact";

export interface ContactCardProps {
  contact: ResolvedContact;
  /** Fired when the user taps the email or phone link. */
  onContactClick?: (channel: "email" | "phone") => void;
  /**
   * Click handler for the "Toon in structuur →" cross-link (position contacts
   * only). The finder intercepts (`preventDefault`) for a smooth in-page panel
   * open + `responsibility_organigram_link`; without it the link navigates to
   * the `?member=` deep-link href.
   */
  onShowInStructure?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

const ACTION =
  "border-ink text-ink hover:bg-jersey-deep hover:text-cream flex h-10 w-10 flex-shrink-0 items-center justify-center border-[1.5px] transition-colors";

const CROSS_LINK =
  "text-jersey-deep border-jersey-deep hover:bg-jersey-deep hover:text-cream mt-2 inline-flex items-center gap-1.5 border-[1.5px] px-2.5 py-2 font-mono text-[10px] font-semibold tracking-[0.05em] uppercase transition-colors";

export function ContactCard({
  contact,
  onContactClick,
  onShowInStructure,
}: ContactCardProps) {
  const { lead, rest } = splitDisplayName(contact.name);
  const hasName = contact.name.trim().length > 0;
  const showRole =
    contact.role.trim().length > 0 && contact.role !== contact.name;
  const phoneHref = contact.phone
    ? `tel:${contact.phone.replace(/\s/g, "")}`
    : undefined;
  const isStructuur = Boolean(contact.nodeId);

  return (
    <div>
      <div className="border-ink bg-cream-soft flex items-center gap-3 border-2 p-3 shadow-[2px_2px_0_0_var(--color-ink)]">
        <span
          aria-hidden
          className="border-ink bg-cream text-jersey-deep font-display-big flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-black"
        >
          {monogramInitials(contact.name)}
        </span>

        <span className="min-w-0 flex-1 leading-tight">
          {hasName && (
            <span className="font-display text-ink block text-[15px] leading-tight">
              <span className="font-semibold">{lead}</span>
              {rest !== "" && (
                <>
                  {" "}
                  <em className="font-normal italic">{rest}</em>
                </>
              )}
            </span>
          )}
          {showRole && (
            <span className="text-jersey-deep mt-0.5 block font-mono text-[9px] tracking-[0.05em] uppercase">
              {contact.role}
            </span>
          )}
        </span>

        {(contact.email || phoneHref) && (
          <span className="flex flex-shrink-0 gap-1.5">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                onClick={() => onContactClick?.("email")}
                aria-label={`E-mail ${contact.name}`}
                className={ACTION}
              >
                <Envelope size={16} aria-hidden />
              </a>
            )}
            {phoneHref && (
              <a
                href={phoneHref}
                onClick={() => onContactClick?.("phone")}
                aria-label={`Bel ${contact.name}`}
                className={ACTION}
              >
                <Phone size={16} aria-hidden />
              </a>
            )}
          </span>
        )}
      </div>

      {contact.organigramHref && (
        <Link
          href={contact.organigramHref}
          onClick={isStructuur ? onShowInStructure : undefined}
          className={CROSS_LINK}
        >
          {isStructuur && <TreeStructure size={12} aria-hidden />}
          {isStructuur ? "Toon in structuur" : "Vind je ploeg"}
          <ArrowRight size={12} aria-hidden />
        </Link>
      )}
    </div>
  );
}

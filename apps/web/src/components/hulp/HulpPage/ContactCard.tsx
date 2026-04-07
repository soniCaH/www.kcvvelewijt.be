"use client";

/**
 * ContactCard — single contact display for the AnswerCard
 *
 * Takes a `ResolvedContact` (already collapsed from the discriminated
 * `Contact` union) and renders a green-left-border card with name, role,
 * and email/phone links. The card calls `onContactClick` for analytics.
 */

import Link from "next/link";
import { Mail, Phone, ChevronRight } from "@/lib/icons";
import type { ResolvedContact } from "./resolveContact";

export interface ContactCardProps {
  contact: ResolvedContact;
  /** Fired when the user clicks the email or phone link */
  onContactClick?: (channel: "email" | "phone") => void;
}

export function ContactCard({ contact, onContactClick }: ContactCardProps) {
  const hasName = contact.name.trim().length > 0;
  const hasRole = contact.role.trim().length > 0;
  return (
    <div className="rounded-sm border-l-4 border-kcvv-green-bright bg-white p-6 shadow-sm">
      <div className="mb-1 text-[0.625rem] font-bold uppercase tracking-[0.15em] text-kcvv-green-dark">
        Contactpersoon
      </div>
      {hasName && (
        <div className="font-title text-2xl font-bold text-kcvv-black">
          {contact.name}
        </div>
      )}
      {hasRole && contact.role !== contact.name && (
        <div className="mt-1 text-sm text-kcvv-gray">{contact.role}</div>
      )}

      {(contact.email || contact.phone) && (
        <div className="mt-4 flex flex-col gap-2 text-sm">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              onClick={() => onContactClick?.("email")}
              className="inline-flex items-center gap-2 text-kcvv-black hover:text-kcvv-green-bright"
            >
              <Mail className="h-4 w-4 text-kcvv-green-dark" />
              {contact.email}
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone.replace(/\s/g, "")}`}
              onClick={() => onContactClick?.("phone")}
              className="inline-flex items-center gap-2 text-kcvv-black hover:text-kcvv-green-bright"
            >
              <Phone className="h-4 w-4 text-kcvv-green-dark" />
              {contact.phone}
            </a>
          )}
        </div>
      )}

      {contact.organigramHref && (
        <Link
          href={contact.organigramHref}
          className="mt-4 inline-flex items-center gap-1 text-sm font-bold uppercase tracking-[0.05em] text-kcvv-green-dark hover:text-kcvv-green-bright"
        >
          Bekijk in organigram
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

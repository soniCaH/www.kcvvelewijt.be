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
    <div className="border-kcvv-green-bright rounded-sm border-l-4 bg-white p-6 shadow-sm">
      <div className="text-kcvv-green-dark mb-1 text-[0.625rem] font-bold tracking-[0.15em] uppercase">
        Contactpersoon
      </div>
      {hasName && (
        <div className="font-title text-kcvv-black text-2xl font-bold">
          {contact.name}
        </div>
      )}
      {hasRole && contact.role !== contact.name && (
        <div className="text-kcvv-gray mt-1 text-sm">{contact.role}</div>
      )}

      {(contact.email || contact.phone) && (
        <div className="mt-4 flex flex-col gap-2 text-sm">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              onClick={() => onContactClick?.("email")}
              className="text-kcvv-black hover:text-kcvv-green-bright inline-flex items-center gap-2"
            >
              <Mail className="text-kcvv-green-dark h-4 w-4" />
              {contact.email}
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone.replace(/\s/g, "")}`}
              onClick={() => onContactClick?.("phone")}
              className="text-kcvv-black hover:text-kcvv-green-bright inline-flex items-center gap-2"
            >
              <Phone className="text-kcvv-green-dark h-4 w-4" />
              {contact.phone}
            </a>
          )}
        </div>
      )}

      {contact.organigramHref && (
        <Link
          href={contact.organigramHref}
          className="text-kcvv-green-dark hover:text-kcvv-green-bright mt-4 inline-flex items-center gap-1 text-sm font-bold tracking-[0.05em] uppercase"
        >
          Bekijk in organigram
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

import Link from "next/link";

export const CONTACT_HREF = "/club/contact";

/** What an empty box says. A key card and a ledger row both carry it. */
export const VACANT_LABEL = "plek vrij — iets voor jou?";

/** The vacancy as a link to the contact page. */
export function VacantLink({ className }: { className?: string }) {
  return (
    <Link
      href={CONTACT_HREF}
      className={`text-jersey-deep text-body-sm font-semibold underline ${className ?? ""}`}
    >
      {VACANT_LABEL}
    </Link>
  );
}

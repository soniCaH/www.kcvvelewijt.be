import { Fragment } from "react";
import Link from "next/link";
import { CONTACT_HREF } from "./Vacant";
import type { OrgChartMember } from "@/types/organigram";

/**
 * A holder's way in: email and phone as written in Sanity, or — when the
 * holder has neither — the secretariaat. Most holders have no public email and
 * nobody has a phone, so the fallback line is the common case, not an error.
 */
/** An email may break after "@" and "." and nowhere else — never inside a word. */
function BreakableEmail({ email }: { email: string }) {
  return email.split(/(?<=[@.])/).map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <wbr />}
      {part}
    </Fragment>
  ));
}

export function MemberContact({ member }: { member: OrgChartMember }) {
  if (!member.email && !member.phone) {
    return (
      <p className="text-ink-muted text-body-sm">
        Contact via{" "}
        <Link href={CONTACT_HREF} className="prose-link">
          het secretariaat
        </Link>
      </p>
    );
  }
  return (
    <p className="text-body-sm flex flex-col">
      {member.email && (
        <a
          href={`mailto:${member.email}`}
          className="text-jersey-deep underline"
        >
          <BreakableEmail email={member.email} />
        </a>
      )}
      {member.phone && (
        <a
          href={`tel:${member.phone.replace(/\s/g, "")}`}
          className="text-ink underline"
        >
          {member.phone}
        </a>
      )}
    </p>
  );
}

/** The holder's name, linked to the staff profile when there is one. */
export function MemberName({
  member,
  className,
}: {
  member: OrgChartMember;
  className: string;
}) {
  const classes = `${className} hyphens-auto break-words`;
  return member.href ? (
    <Link href={member.href} className={`${classes} hover:underline`}>
      {member.name}
    </Link>
  ) : (
    <span className={classes}>{member.name}</span>
  );
}

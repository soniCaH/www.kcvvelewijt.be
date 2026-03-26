import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type { RESPONSIBILITY_PATHS_QUERY_RESULT } from "../sanity/sanity.types";
import type { Contact, ResponsibilityPath } from "@/types/responsibility";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const RESPONSIBILITY_PATHS_QUERY =
  defineQuery(`*[_type == "responsibilityPath" && active == true] | order(title asc) {
  "id": slug.current,
  "role": audience,
  question,
  keywords,
  summary,
  category,
  icon,
  "primaryContact": primaryContact {
    "role": role,
    "email": select(defined(staffMember) => staffMember->email, email),
    "phone": select(defined(staffMember) => staffMember->phone, phone),
    "department": select(defined(staffMember) => staffMember->department, department),
    "name": select(
      defined(staffMember) => staffMember->firstName + " " + staffMember->lastName,
      null
    ),
    "memberId": staffMember->_id
  },
  "steps": steps[] {
    description,
    link,
    "contact": select(defined(contact) => contact {
      "role": role,
      "email": select(defined(staffMember) => staffMember->email, email),
      "phone": select(defined(staffMember) => staffMember->phone, phone),
      "department": select(defined(staffMember) => staffMember->department, department),
      "name": select(
        defined(staffMember) => staffMember->firstName + " " + staffMember->lastName,
        null
      ),
      "memberId": staffMember->_id
    }, null)
  },
  "relatedPaths": coalesce(relatedPaths[]->slug.current, [])
}`);

type PathRow = RESPONSIBILITY_PATHS_QUERY_RESULT[number];
type ContactRow = NonNullable<PathRow["primaryContact"]>;

function toContact(c: ContactRow): Contact {
  return {
    role: c.role ?? "",
    ...(c.name ? { name: c.name } : {}),
    ...(c.email ? { email: c.email } : {}),
    ...(c.phone ? { phone: c.phone } : {}),
    ...(c.department
      ? { department: c.department as Contact["department"] }
      : {}),
    ...(c.memberId ? { memberId: c.memberId } : {}),
  };
}

export function toResponsibilityPath(p: PathRow): ResponsibilityPath {
  const relatedPaths = ((p.relatedPaths ?? []) as (string | null)[]).filter(
    (s): s is string => s != null,
  );
  return {
    id: p.id ?? "",
    role: (p.role ?? []) as ResponsibilityPath["role"],
    question: p.question ?? "",
    keywords: p.keywords ?? [],
    summary: p.summary ?? "",
    category: (p.category ?? "algemeen") as ResponsibilityPath["category"],
    ...(p.icon ? { icon: p.icon } : {}),
    primaryContact: p.primaryContact
      ? toContact(p.primaryContact)
      : { role: "" },
    steps: (p.steps ?? []).map((s, i) => ({
      order: i + 1,
      description: s.description ?? "",
      ...(s.link ? { link: s.link } : {}),
      ...(s.contact ? { contact: toContact(s.contact) } : {}),
    })),
    ...(relatedPaths.length > 0 ? { relatedPaths } : {}),
  };
}

export interface ResponsibilityRepositoryInterface {
  readonly findAll: () => Effect.Effect<ResponsibilityPath[]>;
}

export class ResponsibilityRepository extends Context.Tag(
  "ResponsibilityRepository",
)<ResponsibilityRepository, ResponsibilityRepositoryInterface>() {}

export const ResponsibilityRepositoryLive = Layer.succeed(
  ResponsibilityRepository,
  {
    findAll: () =>
      fetchGroq<RESPONSIBILITY_PATHS_QUERY_RESULT>(
        RESPONSIBILITY_PATHS_QUERY,
      ).pipe(Effect.map((rows) => rows.map(toResponsibilityPath))),
  },
);

import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type { RESPONSIBILITY_PATHS_QUERY_RESULT } from "../sanity/sanity.types";
import type { Contact, ResponsibilityPath } from "@/types/responsibility";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const RESPONSIBILITY_PATHS_QUERY =
  defineQuery(`*[_type == "responsibility" && active == true] | order(title asc) {
  "id": slug.current,
  "role": audience,
  question,
  keywords,
  summary,
  category,
  icon,
  "primaryContact": primaryContact {
    contactType,
    teamRole,
    "position": organigramNode->title,
    "roleCode": organigramNode->roleCode,
    "members": organigramNode->members[]->{
      "id": _id,
      "name": coalesce(firstName, "") + " " + coalesce(lastName, ""),
      email, phone
    },
    "nodeId": organigramNode->_id,
    "role": role,
    "email": email,
    "phone": phone,
    "department": department
  },
  "steps": steps[] {
    description,
    link,
    "contact": select(defined(contact) => contact {
      contactType,
      teamRole,
      "position": organigramNode->title,
      "roleCode": organigramNode->roleCode,
      "members": organigramNode->members[]->{
        "id": _id,
        "name": coalesce(firstName, "") + " " + coalesce(lastName, ""),
        email, phone
      },
      "nodeId": organigramNode->_id,
      "role": role,
      "email": email,
      "phone": phone,
      "department": department
    }, null)
  },
  "relatedPaths": coalesce(relatedPaths[]->slug.current, [])
}`);

type PathRow = RESPONSIBILITY_PATHS_QUERY_RESULT[number];
type ContactRow = NonNullable<PathRow["primaryContact"]>;

function toContact(c: ContactRow): Contact {
  // Default to "manual" when contactType is null (legacy docs or incomplete data)
  const contactType = c.contactType ?? "manual";

  switch (contactType) {
    case "position":
      return {
        contactType,
        ...(c.position ? { position: c.position } : {}),
        ...(c.roleCode ? { roleCode: c.roleCode } : {}),
        ...(c.members?.length
          ? {
              members: c.members
                .filter((m): m is NonNullable<typeof m> => m != null)
                .map((m) => ({
                  id: m.id ?? "",
                  name: (m.name ?? "").replace(/\s+/g, " ").trim(),
                  ...(m.email ? { email: m.email } : {}),
                  ...(m.phone ? { phone: m.phone } : {}),
                })),
            }
          : {}),
        ...(c.nodeId ? { nodeId: c.nodeId } : {}),
      };

    case "team-role":
      // Sanity's `validateContactFields` `Rule.custom` requires `teamRole`
      // on every "team-role" document written through Studio, but that
      // check does not cover documents written via the Content API. Degrade
      // to the same empty "manual" contact the null-`contactType` branch
      // below already falls back to, rather than construct a `Contact` the
      // type says can't exist without a `teamRole`.
      return c.teamRole
        ? { contactType, teamRole: c.teamRole }
        : { contactType: "manual" };

    case "manual":
      return {
        contactType,
        ...(c.role ? { role: c.role } : {}),
        ...(c.email ? { email: c.email } : {}),
        ...(c.phone ? { phone: c.phone } : {}),
        ...(c.department ? { department: c.department } : {}),
      };
  }
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
      : { contactType: "manual" },
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

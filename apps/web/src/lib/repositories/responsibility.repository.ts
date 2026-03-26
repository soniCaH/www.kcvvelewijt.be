import { Context, Effect, Layer } from "effect";
import { sanityClient } from "../sanity/client";
import { RESPONSIBILITY_PATHS_QUERY } from "../sanity/queries/responsibilityPaths";
import type { RESPONSIBILITY_PATHS_QUERY_RESULT } from "../sanity/sanity.types";
import type { Contact, ResponsibilityPath } from "@/types/responsibility";

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

const fetchGroq = <T>(query: string, params?: Record<string, unknown>) =>
  Effect.tryPromise({
    try: () => sanityClient.fetch<T>(query, params ?? {}),
    catch: (cause) => new Error(`Sanity fetch failed: ${String(cause)}`),
  }).pipe(Effect.orDie);

export const ResponsibilityRepositoryLive = Layer.succeed(
  ResponsibilityRepository,
  {
    findAll: () =>
      fetchGroq<RESPONSIBILITY_PATHS_QUERY_RESULT>(
        RESPONSIBILITY_PATHS_QUERY,
      ).pipe(Effect.map((rows) => rows.map(toResponsibilityPath))),
  },
);

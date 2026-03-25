import { Context, Effect, Layer } from "effect";
import { sanityClient } from "../sanity/client";
import { STAFF_MEMBERS_QUERY } from "../sanity/queries/staffMembers";
import type { STAFF_MEMBERS_QUERY_RESULT } from "../sanity/sanity.types";
import type { OrgChartNode } from "@/types/organigram";

const CLUB_ROOT_NODE: OrgChartNode = {
  id: "club",
  name: "KCVV Elewijt",
  title: "Voetbalclub",
  imageUrl: "/images/logo-flat.png",
  department: "algemeen",
  parentId: null,
};

export function toOrgChartNode(
  m: STAFF_MEMBERS_QUERY_RESULT[number],
): OrgChartNode {
  return {
    id: m._id,
    name: `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim(),
    title: m.positionTitle ?? "",
    positionShort: m.positionShort ?? undefined,
    imageUrl: m.photoUrl ?? undefined,
    email: m.email ?? undefined,
    phone: m.phone ?? undefined,
    responsibilities: m.responsibilities ?? undefined,
    department: (m.department ?? undefined) as OrgChartNode["department"],
    parentId: m.parentId ?? "club",
  };
}

export interface StaffRepositoryInterface {
  readonly findAll: () => Effect.Effect<OrgChartNode[]>;
}

export class StaffRepository extends Context.Tag("StaffRepository")<
  StaffRepository,
  StaffRepositoryInterface
>() {}

const fetchGroq = <T>(query: string, params?: Record<string, unknown>) =>
  Effect.tryPromise({
    try: () => sanityClient.fetch<T>(query, params ?? {}),
    catch: (cause) => new Error(`Sanity fetch failed: ${String(cause)}`),
  }).pipe(Effect.orDie);

export const StaffRepositoryLive = Layer.succeed(StaffRepository, {
  findAll: () =>
    fetchGroq<STAFF_MEMBERS_QUERY_RESULT>(STAFF_MEMBERS_QUERY).pipe(
      Effect.map((members) => [CLUB_ROOT_NODE, ...members.map(toOrgChartNode)]),
    ),
});

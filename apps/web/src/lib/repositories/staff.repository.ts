import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type { STAFF_MEMBERS_QUERY_RESULT } from "../sanity/sanity.types";
import type { OrgChartNode } from "@/types/organigram";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const STAFF_MEMBERS_QUERY =
  defineQuery(`*[_type == "staffMember" && archived != true && inOrganigram == true] | order(lastName asc) {
  _id,
  firstName,
  lastName,
  roleLabel,
  roleCode,
  department,
  email,
  phone,
  "photoUrl": photo.asset->url + "?w=200&q=80&fm=webp&fit=max",
  responsibilities,
  "parentId": select(defined(parentMember) && parentMember->inOrganigram == true && parentMember->archived != true => parentMember->_id, null)
}`);

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
    title: m.roleLabel ?? "",
    roleCode: m.roleCode ?? undefined,
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

export const StaffRepositoryLive = Layer.succeed(StaffRepository, {
  findAll: () =>
    fetchGroq<STAFF_MEMBERS_QUERY_RESULT>(STAFF_MEMBERS_QUERY).pipe(
      Effect.map((members) => [CLUB_ROOT_NODE, ...members.map(toOrgChartNode)]),
    ),
});

import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type {
  STAFF_MEMBERS_QUERY_RESULT,
  STAFF_MEMBER_BY_PSD_ID_QUERY_RESULT,
  STAFF_MEMBERS_PSDID_QUERY_RESULT,
} from "../sanity/sanity.types";
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

export const STAFF_MEMBER_BY_PSD_ID_QUERY =
  defineQuery(`*[_type == "staffMember" && psdId == $psdId && archived != true][0] {
  _id, psdId, firstName, lastName, role, roleLabel, department, email, phone, bio,
  "photoUrl": photo.asset->url + "?w=600&q=80&fm=webp&fit=max"
}`);

export const STAFF_MEMBERS_PSDID_QUERY =
  defineQuery(`*[_type == "staffMember" && archived != true && defined(psdId) && psdId != ""] | order(lastName asc) {
  _id, psdId
}`);

// ─── Display label maps ───────────────────────────────────────────────────────

const ROLE_DISPLAY = {
  hoofdtrainer: "Hoofdtrainer",
  assistent: "Assistent-trainer",
  keeperstrainer: "Keeperstrainer",
  tvjo: "TVJO",
  ploegdelegatie: "Ploegdelegatie",
  afgevaardigde: "Afgevaardigde",
  coach: "Coach",
  voorzitter: "Voorzitter",
  ondervoorzitter: "Ondervoorzitter",
  secretaris: "Secretaris",
  penningmeester: "Penningmeester",
  jeugdcoordinator: "Jeugdcoördinator",
  jeugdsecretaris: "Jeugdsecretaris",
  "technisch-coordinator": "Technisch coördinator",
  "sportief-verantwoordelijke": "Sportief verantwoordelijke",
  "sponsoring-verantwoordelijke": "Verantwoordelijke sponsoring",
  "verzekering-verantwoordelijke": "Verzekeringverantwoordelijke",
  "evenementen-coordinator": "Evenementencoördinator",
  "pr-verantwoordelijke": "PR-verantwoordelijke",
  "kantine-verantwoordelijke": "Kantineverantwoordelijke",
  webmaster: "Webmaster",
  bestuur: "Bestuur",
  other: "Andere",
} satisfies Record<
  NonNullable<NonNullable<STAFF_MEMBER_BY_PSD_ID_QUERY_RESULT>["role"]>,
  string
>;

const DEPARTMENT_DISPLAY = {
  hoofdbestuur: "Hoofdbestuur",
  jeugdbestuur: "Jeugdbestuur",
  algemeen: "Algemeen",
} satisfies Record<
  NonNullable<NonNullable<STAFF_MEMBER_BY_PSD_ID_QUERY_RESULT>["department"]>,
  string
>;

// ─── View models ─────────────────────────────────────────────────────────────

const CLUB_ROOT_NODE: OrgChartNode = {
  id: "club",
  name: "KCVV Elewijt",
  title: "Voetbalclub",
  imageUrl: "/images/logo-flat.png",
  department: "algemeen",
  parentId: null,
};

export interface StaffDetailVM {
  id: string;
  psdId: string;
  firstName: string;
  lastName: string;
  /** Mapped display label from role enum (falls back to roleLabel) */
  roleDisplay?: string;
  /** Free-text organigram title */
  roleLabel?: string;
  /** Mapped display label from department enum */
  departmentDisplay?: string;
  email?: string;
  phone?: string;
  bio?: NonNullable<STAFF_MEMBER_BY_PSD_ID_QUERY_RESULT>["bio"];
  imageUrl?: string;
  /** Canonical URL: /staf/{psdId} */
  href: string;
}

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

export function toStaffDetailVM(
  row: NonNullable<STAFF_MEMBER_BY_PSD_ID_QUERY_RESULT>,
): StaffDetailVM {
  const roleDisplay =
    (row.role ? ROLE_DISPLAY[row.role] : undefined) ??
    row.roleLabel ??
    undefined;
  const departmentDisplay = row.department
    ? DEPARTMENT_DISPLAY[row.department]
    : undefined;
  const psdId = row.psdId?.trim() ?? "";

  return {
    id: row._id,
    psdId,
    firstName: row.firstName ?? "",
    lastName: row.lastName ?? "",
    roleDisplay,
    roleLabel: row.roleLabel ?? undefined,
    departmentDisplay,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    bio: row.bio ?? undefined,
    imageUrl: row.photoUrl ?? undefined,
    href: psdId ? `/staf/${psdId}` : "",
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export interface StaffRepositoryInterface {
  readonly findAll: () => Effect.Effect<OrgChartNode[]>;
  readonly findByPsdId: (psdId: string) => Effect.Effect<StaffDetailVM | null>;
  readonly findAllForStaticParams: () => Effect.Effect<{ psdId: string }[]>;
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
  findByPsdId: (psdId) =>
    fetchGroq<STAFF_MEMBER_BY_PSD_ID_QUERY_RESULT>(
      STAFF_MEMBER_BY_PSD_ID_QUERY,
      { psdId },
    ).pipe(Effect.map((row) => (row ? toStaffDetailVM(row) : null))),
  findAllForStaticParams: () =>
    fetchGroq<STAFF_MEMBERS_PSDID_QUERY_RESULT>(STAFF_MEMBERS_PSDID_QUERY).pipe(
      Effect.map((rows) =>
        rows
          .filter(
            (r): r is typeof r & { psdId: string } =>
              r.psdId !== null && r.psdId.trim() !== "",
          )
          .map((r) => ({ psdId: r.psdId })),
      ),
    ),
});

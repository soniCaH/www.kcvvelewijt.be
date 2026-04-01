import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type {
  ORGANIGRAM_NODES_QUERY_RESULT,
  STAFF_MEMBER_BY_PSD_ID_QUERY_RESULT,
  STAFF_MEMBERS_PSDID_QUERY_RESULT,
} from "../sanity/sanity.types";
import type { OrgChartNode } from "@/types/organigram";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const ORGANIGRAM_NODES_QUERY =
  defineQuery(`*[_type == "organigramNode" && active == true] | order(coalesce(sortOrder, 9999) asc, title asc) {
  _id,
  title,
  description,
  roleCode,
  department,
  "parentId": select(defined(parentNode) && parentNode->active == true => parentNode->_id, null),
  "members": members[@->archived != true]->{
    "id": _id,
    "name": coalesce(firstName, "") + " " + coalesce(lastName, ""),
    "imageUrl": photo.asset->url + "?w=200&q=80&fm=webp&fit=max",
    email,
    phone,
    "psdId": psdId
  }
}`);

const KEY_CONTACT_ROLE_CODES = [
  "voorzitter",
  "secretaris",
  "jeugdcoordinator",
  "sponsoring-verantwoordelijke",
  "pr-verantwoordelijke",
] as const;

export const KEY_CONTACTS_QUERY =
  defineQuery(`*[_type == "organigramNode" && active == true && roleCode in $roleCodes]{
  title,
  roleCode,
  "members": members[@->archived != true && defined(@->email)]->{
    "name": coalesce(firstName, "") + " " + coalesce(lastName, ""),
    email
  }
}[count(members) > 0] | order(title asc)`);

export const STAFF_MEMBER_BY_PSD_ID_QUERY =
  defineQuery(`*[_type == "staffMember" && psdId == $psdId && archived != true][0] {
  _id, psdId, firstName, lastName, email, phone, bio,
  "photoUrl": photo.asset->url + "?w=600&q=80&fm=webp&fit=max",
  "organigramPositions": *[_type == "organigramNode" && ^._id in members[]._ref && active == true] | order(title asc, _id asc) { _id, title, roleCode, department },
  "responsibilityPaths": *[_type == "responsibility" && active == true && defined(slug.current) && slug.current != "" && (primaryContact.staffMember._ref == ^._id || ^._id in steps[].contact.staffMember._ref)] | order(title asc, _id asc) { title, "slug": slug.current, category, icon }
}`);

export const STAFF_MEMBERS_PSDID_QUERY =
  defineQuery(`*[_type == "staffMember" && archived != true && defined(psdId) && psdId != ""] | order(lastName asc) {
  _id, psdId
}`);

// ─── View models ─────────────────────────────────────────────────────────────

const CLUB_ROOT_NODE: OrgChartNode = {
  id: "club",
  title: "KCVV Elewijt",
  members: [
    {
      id: "club",
      name: "KCVV Elewijt",
      imageUrl: "/images/logo-flat.png",
    },
  ],
  department: "algemeen",
  parentId: null,
};

export interface KeyContactVM {
  role: string;
  name: string;
  email: string;
}

export function toKeyContactVMs(
  rows: Array<{
    title: string | null;
    roleCode: string | null;
    members: Array<{ name: string; email: string }>;
  }>,
): KeyContactVM[] {
  return rows.flatMap((row) =>
    row.members.map((m) => {
      const trimmed = m.name.trim();
      return {
        role: row.title ?? "",
        name: trimmed === "" ? (row.title ?? "") : trimmed,
        email: m.email,
      };
    }),
  );
}

export interface OrganigramPositionVM {
  _id: string;
  title: string;
  roleCode?: string;
  department?: string;
}

export interface ResponsibilityPathVM {
  title: string;
  slug: string;
  category?: string;
  icon?: string;
}

export interface StaffDetailVM {
  id: string;
  psdId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  bio?: NonNullable<STAFF_MEMBER_BY_PSD_ID_QUERY_RESULT>["bio"];
  imageUrl?: string;
  /** Canonical URL: /staf/{psdId} */
  href: string;
  organigramPositions: OrganigramPositionVM[];
  responsibilityPaths: ResponsibilityPathVM[];
}

export function toOrgChartNode(
  node: ORGANIGRAM_NODES_QUERY_RESULT[number],
): OrgChartNode {
  return {
    id: node._id,
    title: node.title ?? "",
    roleCode: node.roleCode ?? undefined,
    description: node.description ?? undefined,
    department: (node.department ?? undefined) as OrgChartNode["department"],
    parentId: node.parentId ?? "club",
    members: (node.members ?? []).map((m) => {
      const trimmed = (m.name ?? "").trim();
      const psdId = m.psdId?.trim();
      return {
        id: m.id,
        name: trimmed === "" ? undefined : trimmed,
        imageUrl: m.imageUrl ?? undefined,
        email: m.email ?? undefined,
        phone: m.phone ?? undefined,
        href: psdId ? `/staf/${psdId}` : undefined,
      };
    }),
  };
}

export function toStaffDetailVM(
  row: NonNullable<STAFF_MEMBER_BY_PSD_ID_QUERY_RESULT>,
): StaffDetailVM {
  const psdId = row.psdId?.trim() ?? "";

  return {
    id: row._id,
    psdId,
    firstName: row.firstName ?? "",
    lastName: row.lastName ?? "",
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    bio: row.bio ?? undefined,
    imageUrl: row.photoUrl ?? undefined,
    href: psdId ? `/staf/${psdId}` : "",
    organigramPositions: (row.organigramPositions ?? []).map((p) => ({
      _id: p._id,
      title: p.title ?? "",
      ...(p.roleCode ? { roleCode: p.roleCode } : {}),
      ...(p.department ? { department: p.department } : {}),
    })),
    responsibilityPaths: (row.responsibilityPaths ?? []).map((r) => ({
      title: r.title ?? "",
      slug: r.slug ?? "",
      ...(r.category ? { category: r.category } : {}),
      ...(r.icon ? { icon: r.icon } : {}),
    })),
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export interface StaffRepositoryInterface {
  readonly findAll: () => Effect.Effect<OrgChartNode[]>;
  readonly findByPsdId: (psdId: string) => Effect.Effect<StaffDetailVM | null>;
  readonly findKeyContacts: () => Effect.Effect<KeyContactVM[]>;
  readonly findAllForStaticParams: () => Effect.Effect<{ psdId: string }[]>;
}

export class StaffRepository extends Context.Tag("StaffRepository")<
  StaffRepository,
  StaffRepositoryInterface
>() {}

export const StaffRepositoryLive = Layer.succeed(StaffRepository, {
  findAll: () =>
    fetchGroq<ORGANIGRAM_NODES_QUERY_RESULT>(ORGANIGRAM_NODES_QUERY).pipe(
      Effect.map((nodes) => [CLUB_ROOT_NODE, ...nodes.map(toOrgChartNode)]),
    ),
  findByPsdId: (psdId) =>
    fetchGroq<STAFF_MEMBER_BY_PSD_ID_QUERY_RESULT>(
      STAFF_MEMBER_BY_PSD_ID_QUERY,
      { psdId },
    ).pipe(Effect.map((row) => (row ? toStaffDetailVM(row) : null))),
  findKeyContacts: () =>
    fetchGroq<
      Array<{
        title: string | null;
        roleCode: string | null;
        members: Array<{ name: string; email: string }>;
      }>
    >(KEY_CONTACTS_QUERY, { roleCodes: KEY_CONTACT_ROLE_CODES }).pipe(
      Effect.map(toKeyContactVMs),
    ),
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

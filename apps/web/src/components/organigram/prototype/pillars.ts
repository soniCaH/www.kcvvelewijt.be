// PROTOTYPE — throwaway. Simulates the proposed 5-value `department` field by
// mapping today's roleCodes. The real build would read the field from Sanity.
import type { OrgChartMember, OrgChartNode } from "@/types/organigram";

export type PillarKey =
  | "bestuur"
  | "sportief"
  | "jeugd-organisatie"
  | "jeugd-opleiding"
  | "club"
  | "integriteit"
  | "overig";

const BY_CODE: Record<string, PillarKey> = {
  VZ: "bestuur",
  SEC: "bestuur",
  PEN: "bestuur",
  GC: "bestuur",
  BST: "bestuur",
  TD: "sportief",
  "T1-A": "sportief",
  "T2-A": "sportief",
  "KT-F": "sportief",
  "T1-B": "sportief",
  "T2-B": "sportief",
  "DS-B": "sportief",
  POST: "sportief",
  SCO: "sportief",
  JVZ: "jeugd-organisatie",
  JSEC: "jeugd-organisatie",
  AFG: "jeugd-organisatie",
  STA: "jeugd-organisatie",
  REF: "jeugd-organisatie",
  MAT: "jeugd-organisatie",
  KAN: "jeugd-organisatie",
  GDPR: "jeugd-organisatie",
  JBL: "jeugd-organisatie",
  TVJO: "jeugd-opleiding",
  "JC-OB": "jeugd-opleiding",
  "JC-MB": "jeugd-opleiding",
  "JC-BB": "jeugd-opleiding",
  "KT-J": "jeugd-opleiding",
  VID: "jeugd-opleiding",
  KIN: "jeugd-opleiding",
  PSD: "jeugd-opleiding",
  SPO: "club",
  KLE: "club",
  INF: "club",
  "K&E": "club",
  EVT: "club",
  WEB: "club",
  API: "integriteit",
  EC: "integriteit",
};

export function pillarOf(node: OrgChartNode): PillarKey {
  return (node.roleCode && BY_CODE[node.roleCode]) || "overig";
}

/** Real nodes only (no synthetic club root), vacant seats last. */
export function seatsIn(nodes: OrgChartNode[], key: PillarKey) {
  const list = nodes.filter((n) => n.id !== "club" && pillarOf(n) === key);
  return [
    ...list.filter((n) => n.members.length > 0),
    ...list.filter((n) => n.members.length === 0),
  ];
}

/** Staff ids that sit in the board seat (roleCode BST). */
export function boardMemberIds(nodes: OrgChartNode[]): Set<string> {
  const board = nodes.find((n) => n.roleCode === "BST");
  return new Set(board?.members.map((m) => m.id) ?? []);
}

/** Other seat titles a person holds, skipping the board seat and `except`. */
export function otherSeats(
  nodes: OrgChartNode[],
  memberId: string,
  except: OrgChartNode,
): string[] {
  return nodes
    .filter(
      (n) =>
        n.id !== except.id &&
        n.id !== "club" &&
        n.roleCode !== "BST" &&
        n.members.some((m) => m.id === memberId),
    )
    .map((n) => n.title);
}

// ─── Refinement round (2026-10-16) ──────────────────────────────────────────

/**
 * PROPOSAL — who gets the top row. Two groups, each with a reason:
 * - "Dagelijks bestuur": runs the vzw day to day (WVV optional body).
 * - "Aanspreekpunten": the federation-mandated or most-asked-for roles a
 *   visitor needs first. GC + club-API are mandated by the KBVB / Voetbal
 *   Vlaanderen; Jeugdvoorzitter, Sportief verantwoordelijke and TVJO head the
 *   two sporting halves.
 */
export const KEY_FIGURES = [
  { code: "VZ", group: "dagelijks", why: "Eindverantwoordelijke van de club" },
  { code: "SEC", group: "dagelijks", why: "Post, verslagen, de vzw" },
  { code: "PEN", group: "dagelijks", why: "Lidgeld, facturen, budget" },
  { code: "TD", group: "aanspreek", why: "A- en B-elftal" },
  { code: "JVZ", group: "aanspreek", why: "Alles rond de jeugdwerking" },
  { code: "TVJO", group: "aanspreek", why: "Opleiding en trainers jeugd" },
  { code: "GC", group: "aanspreek", why: "Officieel contact met de bond" },
  { code: "API", group: "aanspreek", why: "Vertrouwenspersoon integriteit" },
] as const;

export type KeyGroup = (typeof KEY_FIGURES)[number]["group"];

export function keyFigures(nodes: OrgChartNode[], group?: KeyGroup) {
  return KEY_FIGURES.filter((k) => !group || k.group === group).flatMap((k) => {
    const node = nodes.find((n) => n.roleCode === k.code);
    return node ? [{ ...k, node }] : [];
  });
}

/** Board members (the BST seat) who hold a seat in this pillar. */
export function boardIn(nodes: OrgChartNode[], key: PillarKey) {
  const board = boardMemberIds(nodes);
  const seen = new Map<string, OrgChartMember>();
  for (const n of seatsIn(nodes, key))
    for (const m of n.members) if (board.has(m.id)) seen.set(m.id, m);
  return [...seen.values()];
}

/** One row per single person: their seats in one list merge into one. */
export function mergeSolo(seats: OrgChartNode[]) {
  return seats.reduce<{ node: OrgChartNode; titles: string[] }[]>((acc, n) => {
    const solo = n.members.length === 1 ? n.members[0].id : null;
    const hit = solo
      ? acc.find(
          (r) => r.node.members.length === 1 && r.node.members[0].id === solo,
        )
      : undefined;
    if (hit) hit.titles.push(n.title);
    else acc.push({ node: n, titles: [n.title] });
    return acc;
  }, []);
}

export const PILLARS = [
  {
    key: "sportief",
    title: "Sportief",
    purpose: "Het A- en B-elftal: trainers, keepers en doorstroom.",
  },
  {
    key: "jeugd",
    title: "Jeugd",
    purpose: "Van de kleinsten tot de beloften: organisatie en opleiding.",
  },
  {
    key: "club",
    title: "Club & werking",
    purpose: "Alles naast het veld: sponsors, gebouw, kantine, kledij.",
  },
  {
    key: "integriteit",
    title: "Integriteit",
    purpose:
      "Voor elk probleem rond welzijn, pesten of grensoverschrijdend gedrag.",
  },
] as const;

/** Seats of a pillar; "jeugd" spans organisatie + opleiding. */
export function pillarSeats(nodes: OrgChartNode[], key: string) {
  if (key === "jeugd")
    return [
      ...seatsIn(nodes, "jeugd-organisatie"),
      ...seatsIn(nodes, "jeugd-opleiding"),
    ];
  return seatsIn(nodes, key as PillarKey);
}

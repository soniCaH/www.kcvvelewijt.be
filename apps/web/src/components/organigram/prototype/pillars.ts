// PROTOTYPE — throwaway. Simulates the proposed 5-value `department` field by
// mapping today's roleCodes. The real build would read the field from Sanity.
import type { OrgChartNode } from "@/types/organigram";

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

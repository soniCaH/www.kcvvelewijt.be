import type { OrgChartNode } from "@/types/organigram";

/**
 * The hero's structure-index artefact: three derivable counts, no individual
 * faces (decision 7o1 — there is no `featured`/`heroSpotlight` field, so the
 * hero shows a non-person structure artefact built from counts that can't go
 * stale and need no editorial upkeep).
 */
export interface StructureIndex {
  /** Active organigram positions (node count). */
  posities: number;
  /** Distinct staff members holding positions (deduped across shared roles). */
  mensen: number;
  /** Populated departments (hoofdbestuur / jeugdbestuur / algemeen). */
  afdelingen: number;
}

/**
 * Derive the hero structure index from the organigram nodes. Counts only —
 * positions = nodes, people = distinct staff ids (a person co-holding two roles
 * counts once), departments = distinct populated departments. Vacancies are not
 * foregrounded (7o1).
 */
export function deriveStructureIndex(members: OrgChartNode[]): StructureIndex {
  const peopleIds = new Set<string>();
  const departments = new Set<string>();

  for (const node of members) {
    for (const person of node.members) {
      if (person.id) peopleIds.add(person.id);
    }
    if (node.department) departments.add(node.department);
  }

  return {
    posities: members.length,
    mensen: peopleIds.size,
    afdelingen: departments.size,
  };
}

/**
 * KCVV Elewijt Club Organizational Structure
 *
 * This file contains the complete organizational hierarchy for the club.
 * Update names, titles, and contact information as needed.
 *
 * Structure: Club → Hoofdbestuur & Jeugdbestuur → Departments → Teams → Roles
 */

import type { OrgChartNode } from "@/types/organigram";

/**
 * Complete club organizational structure
 *
 * To update:
 * 1. Replace placeholder names with actual staff names
 * 2. Update titles and responsibilities
 * 3. Add profileUrl links (e.g., "/staff/firstname-lastname")
 * 4. Add imageUrl paths for profile photos
 * 5. Add email and phone contact information
 */
export const clubStructure: OrgChartNode[] = [
  // Root: The Club
  {
    id: "club",
    name: "KCVV Elewijt",
    title: "Voetbalclub",
    imageUrl: "/images/logo-flat.png",
    department: "algemeen",
    parentId: null,
  },

  // ==================== HOOFDBESTUUR ====================
  // Level 1: President
  {
    id: "president",
    name: "[Naam Voorzitter]",
    title: "Voorzitter",
    positionShort: "PRES",
    department: "hoofdbestuur",
    responsibilities:
      "Leiding geven aan het volledige bestuur, vertegenwoordigen van de club naar buiten toe, strategische beslissingen en algemene coördinatie.",
    email: "voorzitter@kcvvelewijt.be",
    parentId: "club",
  },

  // Level 2: Main Board Positions
  {
    id: "vice-president",
    name: "[Naam Ondervoorzitter]",
    title: "Ondervoorzitter",
    positionShort: "VP",
    department: "hoofdbestuur",
    responsibilities:
      "Ondersteunen van de voorzitter, waarnemen bij afwezigheid, specifieke projecten coördineren.",
    email: "ondervoorzitter@kcvvelewijt.be",
    parentId: "president",
  },
  {
    id: "secretary",
    name: "[Naam Secretaris]",
    title: "Secretaris",
    positionShort: "SEC",
    department: "hoofdbestuur",
    responsibilities:
      "Administratie, correspondentie, verslaggeving van vergaderingen, contacten met de bond.",
    email: "secretaris@kcvvelewijt.be",
    parentId: "president",
  },
  {
    id: "treasurer",
    name: "[Naam Penningmeester]",
    title: "Penningmeester",
    positionShort: "PM",
    department: "hoofdbestuur",
    responsibilities:
      "Financieel beheer, budgettering, kascontrole, subsidies aanvragen.",
    email: "penningmeester@kcvvelewijt.be",
    parentId: "president",
  },

  // Level 3: Department Heads under Main Board
  {
    id: "technical-coordinator",
    name: "[Naam Technisch Coördinator]",
    title: "Technisch Coördinator",
    positionShort: "TC",
    department: "hoofdbestuur",
    responsibilities:
      "Coördinatie van alle technische aspecten, trainersbeleid, spelerswerving, sportief beleid.",
    email: "technisch@kcvvelewijt.be",
    parentId: "vice-president",
  },
  {
    id: "infrastructure-manager",
    name: "[Naam Infrastructuur]",
    title: "Infrastructuurbeheerder",
    positionShort: "INFRA",
    department: "hoofdbestuur",
    responsibilities:
      "Onderhoud terreinen, kleedkamers, kantine, materiaal, veiligheid.",
    parentId: "vice-president",
  },
  {
    id: "sponsoring-manager",
    name: "[Naam Sponsoring]",
    title: "Verantwoordelijke Sponsoring",
    positionShort: "SPON",
    department: "hoofdbestuur",
    responsibilities:
      "Sponsorwerving, partnerships, advertenties, sponsorcontacten onderhouden.",
    email: "sponsoring@kcvvelewijt.be",
    parentId: "treasurer",
  },
  {
    id: "communication-manager",
    name: "[Naam Communicatie]",
    title: "Communicatieverantwoordelijke",
    positionShort: "COM",
    department: "hoofdbestuur",
    responsibilities:
      "Website, social media, nieuwsberichten, perscontacten, promotie.",
    email: "communicatie@kcvvelewijt.be",
    parentId: "secretary",
  },
  {
    id: "events-manager",
    name: "[Naam Evenementen]",
    title: "Evenementencoördinator",
    positionShort: "EVENT",
    department: "hoofdbestuur",
    responsibilities:
      "Organisatie clubactiviteiten, feesten, tornooien, recepties.",
    parentId: "secretary",
  },

  // Level 4: Specific Roles under Departments
  {
    id: "head-coach-seniors",
    name: "[Naam Hoofdtrainer Senioren]",
    title: "Hoofdtrainer Senioren",
    positionShort: "T1",
    department: "hoofdbestuur",
    responsibilities:
      "Training en begeleiding eerste ploeg, wedstrijdvoorbereiding, selectie.",
    parentId: "technical-coordinator",
  },
  {
    id: "assistant-coach-seniors",
    name: "[Naam Assistent-trainer]",
    title: "Assistent-trainer Senioren",
    positionShort: "T2",
    department: "hoofdbestuur",
    responsibilities:
      "Ondersteunen hoofdtrainer, specifieke trainingen, analyse.",
    parentId: "head-coach-seniors",
  },
  {
    id: "keeper-coach",
    name: "[Naam Keeperstrainer]",
    title: "Keeperstrainer",
    positionShort: "TK",
    department: "hoofdbestuur",
    responsibilities: "Specialistische keeperstrainingen voor alle ploegen.",
    parentId: "technical-coordinator",
  },
  {
    id: "groundskeeper",
    name: "[Naam Terreinbeheerder]",
    title: "Terreinbeheerder",
    positionShort: "GRND",
    department: "hoofdbestuur",
    responsibilities:
      "Onderhoud velden, lijnen trekken, gras maaien, beregening.",
    parentId: "infrastructure-manager",
  },
  {
    id: "canteen-manager",
    name: "[Naam Kantinebeheerder]",
    title: "Kantinebeheerder",
    positionShort: "KANT",
    department: "hoofdbestuur",
    responsibilities:
      "Beheer kantine, voorraadbeheer, vrijwilligers coördineren.",
    parentId: "infrastructure-manager",
  },
  {
    id: "social-media-manager",
    name: "[Naam Social Media]",
    title: "Social Media Manager",
    positionShort: "SMM",
    department: "hoofdbestuur",
    responsibilities:
      "Facebook, Instagram, Twitter/X beheren, content creatie, engagement.",
    parentId: "communication-manager",
  },
  {
    id: "photographer",
    name: "[Naam Fotograaf]",
    title: "Clubfotograaf",
    positionShort: "FOTO",
    department: "hoofdbestuur",
    responsibilities:
      "Fotograferen wedstrijden en evenementen, beelden beschikbaar stellen.",
    parentId: "communication-manager",
  },

  // ==================== JEUGDBESTUUR ====================
  // Level 2: Youth Coordinator (directly under President)
  {
    id: "youth-coordinator",
    name: "[Naam Jeugdcoördinator]",
    title: "Jeugdcoördinator",
    positionShort: "JC",
    department: "jeugdbestuur",
    responsibilities:
      "Algemene leiding jeugdwerking, coördinatie jeugdbestuur, link met hoofdbestuur.",
    email: "jeugd@kcvvelewijt.be",
    parentId: "president",
  },

  // Level 3: Youth Board Members
  {
    id: "youth-technical-coordinator",
    name: "[Naam Technisch Verantwoordelijke Jeugd]",
    title: "Technisch Verantwoordelijke Jeugd",
    positionShort: "TJ",
    department: "jeugdbestuur",
    responsibilities:
      "Trainersbeleid jeugd, sportieve ontwikkeling, opleiding trainers.",
    parentId: "youth-coordinator",
  },
  {
    id: "youth-secretary",
    name: "[Naam Secretaris Jeugd]",
    title: "Secretaris Jeugdbestuur",
    positionShort: "JSEC",
    department: "jeugdbestuur",
    responsibilities:
      "Administratie jeugdwerking, inschrijvingen, mutaties, contacten bond.",
    parentId: "youth-coordinator",
  },
  {
    id: "youth-treasurer",
    name: "[Naam Penningmeester Jeugd]",
    title: "Penningmeester Jeugdbestuur",
    positionShort: "JPM",
    department: "jeugdbestuur",
    responsibilities: "Financiën jeugdwerking, budgetbeheer, ouder bijdragen.",
    parentId: "youth-coordinator",
  },
  {
    id: "youth-events",
    name: "[Naam Jeugdevenementen]",
    title: "Jeugdevenementencoördinator",
    positionShort: "JEV",
    department: "jeugdbestuur",
    responsibilities:
      "Organisatie jeugdtornooien, sinterklaasfeest, eindejaarfeest, kampen.",
    parentId: "youth-coordinator",
  },

  // Level 4: Age Category Coordinators
  {
    id: "u6-u9-coordinator",
    name: "[Naam Coördinator U6-U9]",
    title: "Coördinator Benjamins (U6-U9)",
    positionShort: "U6-9",
    department: "jeugdbestuur",
    responsibilities:
      "Coördinatie benjamin ploegen, oudercontacten, trainersondersteuning.",
    parentId: "youth-technical-coordinator",
  },
  {
    id: "u10-u12-coordinator",
    name: "[Naam Coördinator U10-U12]",
    title: "Coördinator Pupillen (U10-U12)",
    positionShort: "U10-12",
    department: "jeugdbestuur",
    responsibilities:
      "Coördinatie pupillen ploegen, wedstrijdplanning, ontwikkeling.",
    parentId: "youth-technical-coordinator",
  },
  {
    id: "u13-u15-coordinator",
    name: "[Naam Coördinator U13-U15]",
    title: "Coördinator Scholieren (U13-U15)",
    positionShort: "U13-15",
    department: "jeugdbestuur",
    responsibilities: "Coördinatie scholieren ploegen, talentbegeleiding.",
    parentId: "youth-technical-coordinator",
  },
  {
    id: "u16-u19-coordinator",
    name: "[Naam Coördinator U16-U19]",
    title: "Coördinator Juniors (U16-U19)",
    positionShort: "U16-19",
    department: "jeugdbestuur",
    responsibilities: "Coördinatie junior ploegen, doorstroming naar senioren.",
    parentId: "youth-technical-coordinator",
  },

  // Level 5: Specific Youth Trainers (examples under one category)
  {
    id: "trainer-u8",
    name: "[Naam Trainer U8]",
    title: "Trainer U8",
    positionShort: "T-U8",
    department: "jeugdbestuur",
    responsibilities: "Wekelijkse trainingen en wedstrijdbegeleiding U8.",
    parentId: "u6-u9-coordinator",
  },
  {
    id: "trainer-u10",
    name: "[Naam Trainer U10]",
    title: "Trainer U10",
    positionShort: "T-U10",
    department: "jeugdbestuur",
    responsibilities: "Wekelijkse trainingen en wedstrijdbegeleiding U10.",
    parentId: "u10-u12-coordinator",
  },
  {
    id: "trainer-u13",
    name: "[Naam Trainer U13]",
    title: "Trainer U13",
    positionShort: "T-U13",
    department: "jeugdbestuur",
    responsibilities: "Wekelijkse trainingen en wedstrijdbegeleiding U13.",
    parentId: "u13-u15-coordinator",
  },

  // Additional specialized youth roles
  {
    id: "youth-material-manager",
    name: "[Naam Materiaalverantwoordelijke Jeugd]",
    title: "Materiaalverantwoordelijke Jeugd",
    positionShort: "JMAT",
    department: "jeugdbestuur",
    responsibilities:
      "Beheer jeugdmateriaal, tenues, ballen, trainingsmaterialen.",
    parentId: "youth-secretary",
  },
  {
    id: "youth-volunteer-coordinator",
    name: "[Naam Vrijwilligerscoördinator Jeugd]",
    title: "Vrijwilligerscoördinator Jeugd",
    positionShort: "JVOL",
    department: "jeugdbestuur",
    responsibilities:
      "Coördineren ouders en vrijwilligers voor jeugdactiviteiten.",
    parentId: "youth-secretary",
  },
];

/**
 * Constructs the organization as a hierarchical tree with nested `_children` arrays.
 *
 * Each node is a shallow copy of the original entry with an added `_children` array containing its direct descendants.
 *
 * @returns The root `OrgChartNode` whose descendants are linked via the `_children` arrays.
 * @throws Error if no root node (a node without `parentId`) is found in `clubStructure`.
 */
export function getHierarchicalStructure(): OrgChartNode {
  const nodeMap = new Map<string, OrgChartNode>();
  const rootNode = clubStructure.find((node) => !node.parentId);

  if (!rootNode) {
    throw new Error("No root node found in club structure");
  }

  // Create a map of all nodes
  clubStructure.forEach((node) => {
    nodeMap.set(node.id, { ...node, _children: [] });
  });

  // Build the hierarchy
  clubStructure.forEach((node) => {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      const current = nodeMap.get(node.id);
      if (parent && current) {
        parent._children = parent._children || [];
        parent._children.push(current);
      }
    }
  });

  return nodeMap.get(rootNode.id)!;
}

/**
 * Filter club members by department.
 *
 * @param department - The department to match on each member's `department` field
 * @returns An array of `OrgChartNode` entries belonging to the specified department
 */
export function getMembersByDepartment(
  department: "hoofdbestuur" | "jeugdbestuur" | "algemeen",
) {
  return clubStructure.filter((node) => node.department === department);
}

/**
 * Finds club members whose name or title contains the given query string (case-insensitive).
 *
 * @param query - The text to search for in member `name` and `title`
 * @returns An array of `OrgChartNode` objects whose `name` or `title` contains `query`, case-insensitive
 */
export function searchMembers(query: string): OrgChartNode[] {
  const lowercaseQuery = query.toLowerCase();
  return clubStructure.filter(
    (node) =>
      node.name.toLowerCase().includes(lowercaseQuery) ||
      node.title.toLowerCase().includes(lowercaseQuery),
  );
}

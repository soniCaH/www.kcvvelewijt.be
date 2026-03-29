import type { OrgChartNode } from "@/types/organigram";

/**
 * Fixture data for Storybook stories — mirrors the shape returned by
 * StaffRepository.findAll() so stories stay realistic.
 */
export const staffMembersFixture: OrgChartNode[] = [
  // Root
  {
    id: "club",
    title: "KCVV Elewijt",
    members: [
      { id: "club", name: "KCVV Elewijt", imageUrl: "/images/logo-flat.png" },
    ],
    department: "algemeen",
    parentId: null,
  },

  // Hoofdbestuur
  {
    id: "president",
    title: "Voorzitter",
    roleCode: "PRES",
    department: "hoofdbestuur",
    description:
      "Leiding geven aan het volledige bestuur, vertegenwoordigen van de club naar buiten toe.",
    members: [
      {
        id: "staff-president",
        name: "Jan Voorzitter",
        email: "voorzitter@kcvvelewijt.be",
      },
    ],
    parentId: "club",
  },
  {
    id: "vice-president",
    title: "Ondervoorzitter",
    roleCode: "VP",
    department: "hoofdbestuur",
    description: "Ondersteunen van de voorzitter, waarnemen bij afwezigheid.",
    members: [
      {
        id: "staff-vp",
        name: "Marie Ondervoorzitter",
        email: "ondervoorzitter@kcvvelewijt.be",
      },
    ],
    parentId: "president",
  },
  {
    id: "secretary",
    title: "Secretaris",
    roleCode: "SEC",
    department: "hoofdbestuur",
    description:
      "Administratie, correspondentie, verslaggeving van vergaderingen.",
    members: [
      {
        id: "staff-sec",
        name: "Luc Secretaris",
        email: "secretaris@kcvvelewijt.be",
      },
    ],
    parentId: "president",
  },
  {
    id: "treasurer",
    title: "Penningmeester",
    roleCode: "PM",
    department: "hoofdbestuur",
    description: "Financieel beheer, budgettering, kascontrole.",
    members: [
      {
        id: "staff-pm",
        name: "Els Penningmeester",
        email: "penningmeester@kcvvelewijt.be",
      },
    ],
    parentId: "president",
  },
  {
    id: "technical-coordinator",
    title: "Technisch Coördinator",
    roleCode: "TC",
    department: "hoofdbestuur",
    description: "Coördinatie van alle technische aspecten, trainersbeleid.",
    members: [
      {
        id: "staff-tc",
        name: "Dirk Technisch",
        email: "technisch@kcvvelewijt.be",
      },
    ],
    parentId: "vice-president",
  },
  {
    id: "head-coach-seniors",
    title: "Hoofdtrainer Senioren",
    roleCode: "T1",
    department: "hoofdbestuur",
    description: "Training en begeleiding eerste ploeg.",
    members: [{ id: "staff-t1", name: "Marc Trainer" }],
    parentId: "technical-coordinator",
  },
  {
    id: "communication-manager",
    title: "Communicatieverantwoordelijke",
    roleCode: "COM",
    department: "hoofdbestuur",
    description: "Website, social media, nieuwsberichten.",
    members: [
      {
        id: "staff-com",
        name: "Sofie Communicatie",
        email: "communicatie@kcvvelewijt.be",
      },
    ],
    parentId: "secretary",
  },

  // Jeugdbestuur
  {
    id: "youth-coordinator",
    title: "Jeugdcoördinator",
    roleCode: "JC",
    department: "jeugdbestuur",
    description: "Algemene leiding jeugdwerking, coördinatie jeugdbestuur.",
    members: [
      {
        id: "staff-jc",
        name: "Petra Jeugd",
        email: "jeugd@kcvvelewijt.be",
      },
    ],
    parentId: "president",
  },
  {
    id: "youth-technical-coordinator",
    title: "Technisch Verantwoordelijke Jeugd",
    roleCode: "TJ",
    department: "jeugdbestuur",
    description: "Trainersbeleid jeugd, sportieve ontwikkeling.",
    members: [{ id: "staff-tj", name: "Tom Technisch Jeugd" }],
    parentId: "youth-coordinator",
  },
  {
    id: "youth-secretary",
    title: "Secretaris Jeugdbestuur",
    roleCode: "JSEC",
    department: "jeugdbestuur",
    description: "Administratie jeugdwerking, inschrijvingen, mutaties.",
    members: [{ id: "staff-jsec", name: "An Secretaris Jeugd" }],
    parentId: "youth-coordinator",
  },
];

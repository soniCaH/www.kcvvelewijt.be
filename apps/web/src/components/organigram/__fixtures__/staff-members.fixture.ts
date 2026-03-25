import type { OrgChartNode } from "@/types/organigram";

/**
 * Fixture data for Storybook stories — mirrors the shape returned by
 * StaffRepository.findAll() so stories stay realistic.
 */
export const staffMembersFixture: OrgChartNode[] = [
  // Root
  {
    id: "club",
    name: "KCVV Elewijt",
    title: "Voetbalclub",
    imageUrl: "/images/logo-flat.png",
    department: "algemeen",
    parentId: null,
  },

  // Hoofdbestuur
  {
    id: "president",
    name: "Jan Voorzitter",
    title: "Voorzitter",
    positionShort: "PRES",
    department: "hoofdbestuur",
    responsibilities:
      "Leiding geven aan het volledige bestuur, vertegenwoordigen van de club naar buiten toe.",
    email: "voorzitter@kcvvelewijt.be",
    parentId: "club",
  },
  {
    id: "vice-president",
    name: "Marie Ondervoorzitter",
    title: "Ondervoorzitter",
    positionShort: "VP",
    department: "hoofdbestuur",
    responsibilities:
      "Ondersteunen van de voorzitter, waarnemen bij afwezigheid.",
    email: "ondervoorzitter@kcvvelewijt.be",
    parentId: "president",
  },
  {
    id: "secretary",
    name: "Luc Secretaris",
    title: "Secretaris",
    positionShort: "SEC",
    department: "hoofdbestuur",
    responsibilities:
      "Administratie, correspondentie, verslaggeving van vergaderingen.",
    email: "secretaris@kcvvelewijt.be",
    parentId: "president",
  },
  {
    id: "treasurer",
    name: "Els Penningmeester",
    title: "Penningmeester",
    positionShort: "PM",
    department: "hoofdbestuur",
    responsibilities: "Financieel beheer, budgettering, kascontrole.",
    email: "penningmeester@kcvvelewijt.be",
    parentId: "president",
  },
  {
    id: "technical-coordinator",
    name: "Dirk Technisch",
    title: "Technisch Coördinator",
    positionShort: "TC",
    department: "hoofdbestuur",
    responsibilities:
      "Coördinatie van alle technische aspecten, trainersbeleid.",
    email: "technisch@kcvvelewijt.be",
    parentId: "vice-president",
  },
  {
    id: "head-coach-seniors",
    name: "Marc Trainer",
    title: "Hoofdtrainer Senioren",
    positionShort: "T1",
    department: "hoofdbestuur",
    responsibilities: "Training en begeleiding eerste ploeg.",
    parentId: "technical-coordinator",
  },
  {
    id: "communication-manager",
    name: "Sofie Communicatie",
    title: "Communicatieverantwoordelijke",
    positionShort: "COM",
    department: "hoofdbestuur",
    responsibilities: "Website, social media, nieuwsberichten.",
    email: "communicatie@kcvvelewijt.be",
    parentId: "secretary",
  },

  // Jeugdbestuur
  {
    id: "youth-coordinator",
    name: "Petra Jeugd",
    title: "Jeugdcoördinator",
    positionShort: "JC",
    department: "jeugdbestuur",
    responsibilities:
      "Algemene leiding jeugdwerking, coördinatie jeugdbestuur.",
    email: "jeugd@kcvvelewijt.be",
    parentId: "president",
  },
  {
    id: "youth-technical-coordinator",
    name: "Tom Technisch Jeugd",
    title: "Technisch Verantwoordelijke Jeugd",
    positionShort: "TJ",
    department: "jeugdbestuur",
    responsibilities: "Trainersbeleid jeugd, sportieve ontwikkeling.",
    parentId: "youth-coordinator",
  },
  {
    id: "youth-secretary",
    name: "An Secretaris Jeugd",
    title: "Secretaris Jeugdbestuur",
    positionShort: "JSEC",
    department: "jeugdbestuur",
    responsibilities: "Administratie jeugdwerking, inschrijvingen, mutaties.",
    parentId: "youth-coordinator",
  },
];

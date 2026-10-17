import type { OrgChartMember, OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import { explorerFixture } from "../OrganigramExplorer/organigram-explorer.fixture";

/**
 * Story/test fixture for the clubboek: the explorer's tree shape (real box
 * titles, real vacant and shared boxes, generic holders) plus what the section
 * itself reads — why-lines on the key boxes, a Raad van bestuur whose members
 * also hold boxes, a person holding two boxes in one pillar, and a few hulp
 * questions. Never real people.
 */

const WHY: Record<string, string> = {
  VZ: "Eindverantwoordelijke van de club",
  SEC: "Post, verslagen, de vzw",
  PEN: "Lidgeld, facturen, budget",
  TD: "A- en B-elftal",
  JVZ: "Alles rond de jeugdwerking",
  TVJO: "Opleiding en trainers jeugd",
  GC: "Officieel contact met de bond",
  API: "Vertrouwenspersoon integriteit",
};

const byId = (id: string) => explorerFixture.find((n) => n.id === id);
const firstHolder = (id: string): OrgChartMember[] => {
  const holder = byId(id)?.members[0];
  return holder ? [holder] : [];
};

/** The Raad van bestuur: people who also hold boxes elsewhere in the tree. */
const RAAD: OrgChartMember[] = [
  ...firstHolder("voorzitter"),
  ...firstHolder("kledij"),
  ...firstHolder("tvjo"),
  ...firstHolder("website"),
  ...firstHolder("infrastructuur"),
  ...firstHolder("jeugdvoorzitter"),
];

export const clubBookNodes: OrgChartNode[] = explorerFixture
  .filter((n) => n.id !== "club")
  .map((node, index) => {
    const description = node.roleCode ? WHY[node.roleCode] : undefined;
    // A person holding two boxes in the same list: TVJO's holder also runs the
    // Onderbouw — they merge into one row ("TVJO · Jeugdcoördinator Onderbouw").
    const members =
      node.id === "bestuursorgaan"
        ? RAAD
        : node.id === "jc-onderbouw"
          ? firstHolder("tvjo")
          : node.members.map((member) =>
              // Give the first key holders an email so both contact lines render.
              index < 4 && member === node.members[0]
                ? { ...member, email: `${member.id}@kcvv.example` }
                : member,
            );
    return { ...node, members, ...(description ? { description } : {}) };
  });

const question = (
  id: string,
  nodeId: string,
  text: string,
): ResponsibilityPath => {
  const node = clubBookNodes.find((n) => n.id === nodeId);
  return {
    id,
    title: id,
    role: ["ouder"],
    question: text,
    keywords: [],
    summary: "",
    steps: [],
    category: "algemeen",
    primaryContact: {
      contactType: "position",
      nodeId,
      members: (node?.members ?? []).map((m) => ({
        id: m.id,
        name: m.name ?? "",
      })),
    },
  };
};

export const clubBookPaths: ResponsibilityPath[] = [
  question("allergie", "tvjo", "wil allergieën van mijn kind melden"),
  question("trainers", "tvjo", "wil weten wie de trainer van mijn kind is"),
  question("onderbouw", "jc-onderbouw", "heb een vraag over de onderbouw"),
  question("sponsor", "sponsoring", "wil de club sponsoren"),
  question("jeugd", "jeugdvoorzitter", "heb vragen over de jeugdwerking"),
  question("kledij", "kledij", "zoek een trainingspak voor mijn kind"),
];

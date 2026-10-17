import type {
  OrgChartMember,
  OrgChartNode,
  OrgPillar,
} from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";

/**
 * The `/hulp` clubboek view model: turns the organigram nodes and the hulp
 * questions into everything the structuur section renders — the key-figure
 * cards, the Raad van bestuur line and a ledger per pillar. Components only
 * lay this out; the grouping, merging and ordering decisions live here.
 *
 * The organigram is who does the work day to day. The board teams on
 * `/club/bestuur` and `/club/jeugdbestuur` are the board on paper — this
 * module never reads or syncs them.
 */

export interface RowQuestion {
  /** The responsibility path id — the finder's `#<id>` anchor. */
  id: string;
  question: string;
}

/** A holder with the questions they answer **in the role this row shows**. */
export interface RowHolder extends OrgChartMember {
  questions: RowQuestion[];
}

export interface LedgerRow {
  /** First box id — the row's React key. */
  id: string;
  /** Every box id merged into this row; the finder, search and `?member=` resolve against these. */
  nodeIds: string[];
  titles: string[];
  /** Empty = vacant. */
  holders: RowHolder[];
}

export interface KeyFigure {
  nodeId: string;
  title: string;
  /** The box's `description`, trimmed. Undefined when the editor wrote none — never borrowed from elsewhere. */
  why: string | undefined;
  /** Empty = vacant. */
  holders: OrgChartMember[];
}

export interface KeyGroup {
  title: string;
  figures: KeyFigure[];
}

export interface ChapterSubsection {
  heading: string | undefined;
  rows: LedgerRow[];
}

export type ChapterKey = "sportief" | "jeugd" | "club" | "integriteit";

export interface Chapter {
  key: ChapterKey;
  title: string;
  purpose: string;
  /** Raad van bestuur members who hold a box in this pillar. */
  board: OrgChartMember[];
  sections: ChapterSubsection[];
  boardLink: BoardLink | undefined;
}

export interface BoardLink {
  href: string;
  label: string;
}

export interface ClubBookVM {
  keyGroups: KeyGroup[];
  /** The hoofdbestuur page, linked under the key cards. */
  boardLink: BoardLink;
  /** The Bestuursorgaan box and its members; undefined when there is none or it has no named member. */
  raad: { nodeId: string; members: OrgChartMember[] } | undefined;
  chapters: Chapter[];
  /** Boxes with no pillar — shown last so nothing silently disappears. */
  overige: LedgerRow[];
}

/**
 * The top row: which boxes and in what order is a design decision, so it stays
 * here. The "why" under each card is the box's `description`, an editor's text.
 */
const KEY_GROUPS: ReadonlyArray<{ title: string; roleCodes: string[] }> = [
  { title: "Dagelijks bestuur", roleCodes: ["VZ", "SEC", "PEN"] },
  { title: "Aanspreekpunten", roleCodes: ["TD", "JVZ", "TVJO", "GC", "API"] },
];

const RAAD_ROLE_CODE = "BST";

/** The board team pages: the board on paper, linked from here and never merged into it. */
const BOARD_LINKS = {
  hoofdbestuur: { href: "/club/bestuur", label: "Bekijk het hoofdbestuur" },
  jeugdbestuur: {
    href: "/club/jeugdbestuur",
    label: "Bekijk het jeugdbestuur",
  },
} as const satisfies Record<string, BoardLink>;

const CHAPTERS: ReadonlyArray<{
  key: ChapterKey;
  title: string;
  purpose: string;
  sections: ReadonlyArray<{ heading?: string; pillars: OrgPillar[] }>;
  boardLink?: BoardLink;
}> = [
  {
    key: "sportief",
    title: "Sportief",
    purpose: "Het A- en B-elftal: trainers, keepers en doorstroom.",
    sections: [{ pillars: ["sportief"] }],
  },
  {
    key: "jeugd",
    title: "Jeugd",
    purpose: "Van de kleinsten tot de beloften: organisatie en opleiding.",
    sections: [
      { heading: "Organisatie", pillars: ["jeugd-organisatie"] },
      { heading: "Opleiding", pillars: ["jeugd-opleiding"] },
    ],
    boardLink: BOARD_LINKS.jeugdbestuur,
  },
  {
    key: "club",
    title: "Club & werking",
    purpose: "Alles naast het veld: sponsors, gebouw, kantine, kledij.",
    sections: [{ pillars: ["club"] }],
  },
  {
    key: "integriteit",
    title: "Integriteit",
    purpose:
      "Voor elk probleem rond welzijn, pesten of grensoverschrijdend gedrag.",
    sections: [{ pillars: ["integriteit"] }],
  },
];

/** A holder with no name has nothing to show; they count as no holder. */
const named = (members: OrgChartMember[]) =>
  members.filter((m) => m.name?.trim());

/** `Ann, Bob` — names only, so a nameless holder never leaves a stray comma. */
export function joinNames(members: OrgChartMember[]): string {
  return named(members)
    .map((m) => m.name?.trim())
    .join(", ");
}

/** The questions `holder` answers from this box: primary contact is this box and includes them. */
function questionsFor(
  holder: OrgChartMember,
  nodeIds: string[],
  paths: ResponsibilityPath[],
): RowQuestion[] {
  return paths
    .filter(
      ({ primaryContact: c }) =>
        c.contactType === "position" &&
        c.nodeId !== undefined &&
        nodeIds.includes(c.nodeId) &&
        (c.members ?? []).some((m) => m.id === holder.id),
    )
    .map(({ id, question }) => ({ id, question }));
}

/**
 * One row per box — except that boxes a single person holds alone merge into
 * one row. A shared box never merges. Rows with a holder come first, vacant
 * rows last; within both groups the incoming order holds.
 */
function toRows(
  boxes: OrgChartNode[],
  paths: ResponsibilityPath[],
): LedgerRow[] {
  const holders = (box: OrgChartNode) => named(box.members);
  const ordered = [
    ...boxes.filter((b) => holders(b).length > 0),
    ...boxes.filter((b) => holders(b).length === 0),
  ];

  const groups: OrgChartNode[][] = [];
  for (const box of ordered) {
    const solo = holders(box).length === 1 ? holders(box)[0]?.id : undefined;
    const home = solo
      ? groups.find(
          ([first]) =>
            first &&
            holders(first).length === 1 &&
            holders(first)[0]?.id === solo,
        )
      : undefined;
    if (home) home.push(box);
    else groups.push([box]);
  }

  return groups.map((group) => {
    const nodeIds = group.map((b) => b.id);
    return {
      id: nodeIds[0] ?? "",
      nodeIds,
      titles: group.map((b) => b.title),
      holders: (group[0] ? holders(group[0]) : []).map((m) => ({
        ...m,
        questions: questionsFor(m, nodeIds, paths),
      })),
    };
  });
}

export function buildClubBook(
  nodes: OrgChartNode[],
  paths: ResponsibilityPath[],
): ClubBookVM {
  const byCode = (code: string) => nodes.find((n) => n.roleCode === code);

  // Boxes a card or the Raad line already shows. Any other box lands in a
  // ledger row, so a second box with a key code never vanishes.
  const consumed = new Set<string>();
  const keyGroups = KEY_GROUPS.map(({ title, roleCodes }) => ({
    title,
    figures: roleCodes.flatMap((code) => {
      const node = byCode(code);
      if (!node) return [];
      consumed.add(node.id);
      return [
        {
          nodeId: node.id,
          title: node.title,
          why: node.description?.trim() || undefined,
          holders: named(node.members),
        },
      ];
    }),
  }));

  const raadBox = byCode(RAAD_ROLE_CODE);
  const raadMembers = raadBox ? named(raadBox.members) : [];
  const raad =
    raadBox && raadMembers.length > 0
      ? { nodeId: raadBox.id, members: raadMembers }
      : undefined;
  if (raad) consumed.add(raad.nodeId);
  const raadIds = new Set(raadMembers.map((m) => m.id));

  const inPillars = (wanted: OrgPillar[]) =>
    nodes.filter((n) => n.pillar !== undefined && wanted.includes(n.pillar));

  const chapters = CHAPTERS.map((def) => {
    const sections = def.sections.map((s) => ({
      heading: s.heading,
      rows: toRows(inPillars(s.pillars), paths),
    }));
    const board = new Map<string, OrgChartMember>();
    for (const row of sections.flatMap((s) => s.rows))
      for (const m of row.holders)
        if (raadIds.has(m.id) && !board.has(m.id)) board.set(m.id, m);
    return {
      key: def.key,
      title: def.title,
      purpose: def.purpose,
      board: [...board.values()],
      sections,
      boardLink: def.boardLink,
    };
  });

  // Not in a ledger (no pillar, or `bestuur`, which has none) and not on a
  // card or the Raad line: shown last so nothing silently disappears.
  const inLedger = new Set<OrgPillar>(
    CHAPTERS.flatMap((p) => p.sections.flatMap((s) => s.pillars)),
  );
  const isLeftover = (n: OrgChartNode) =>
    !consumed.has(n.id) && !(n.pillar !== undefined && inLedger.has(n.pillar));

  return {
    keyGroups,
    boardLink: BOARD_LINKS.hoofdbestuur,
    raad,
    chapters,
    overige: toRows(nodes.filter(isLeftover), paths),
  };
}

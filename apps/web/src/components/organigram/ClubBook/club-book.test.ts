import { describe, expect, it } from "vitest";
import type { OrgChartMember, OrgChartNode } from "@/types/organigram";
import type { Contact, ResponsibilityPath } from "@/types/responsibility";
import { explorerFixture } from "../OrganigramExplorer/organigram-explorer.fixture";
import { buildClubBook, joinNames } from "./club-book";

const person = (id: string, name = id) => ({ id, name });

const box = (
  id: string,
  title: string,
  members: OrgChartMember[],
  rest: Partial<OrgChartNode> = {},
): OrgChartNode => ({ id, title, members, parentId: "club", ...rest });

const question = (
  id: string,
  nodeId: string,
  members: { id: string; name: string }[],
  contactType: "position" | "manual" = "position",
): ResponsibilityPath => {
  const primaryContact: Contact =
    contactType === "position"
      ? { contactType: "position", nodeId, members }
      : { contactType: "manual", role: "Kantine" };
  return {
    id,
    title: id,
    role: ["ouder"],
    question: `vraag ${id}`,
    keywords: [],
    summary: "",
    steps: [],
    primaryContact,
    category: "algemeen",
  };
};

const rowsOf = (book: ReturnType<typeof buildClubBook>, pillar: string) =>
  book.chapters
    .find((c) => c.key === pillar)
    ?.sections.flatMap((s) => s.rows) ?? [];

describe("buildClubBook", () => {
  describe("key figures", () => {
    it("groups the top row in the designed order", () => {
      const { keyGroups } = buildClubBook(explorerFixture, []);

      expect(
        keyGroups.map((g) => [g.title, g.figures.map((f) => f.title)]),
      ).toEqual([
        ["Dagelijks bestuur", ["Voorzitter", "Secretaris", "Penningmeester"]],
        [
          "Aanspreekpunten",
          [
            "Sportief Verantwoordelijke",
            "Jeugdvoorzitter",
            "TVJO",
            "Gerechtigd Correspondent",
            "API (Aanspreekpunt Integriteit)",
          ],
        ],
      ]);
    });

    it("shows a second box with a key role code in a row instead of dropping it", () => {
      const nodes = [
        box("sec", "Secretaris", [person("a")], {
          roleCode: "SEC",
          pillar: "bestuur",
        }),
        box("sec2", "Tweede secretaris", [person("b")], {
          roleCode: "SEC",
          pillar: "bestuur",
        }),
      ];

      const book = buildClubBook(nodes, []);
      expect(
        book.keyGroups.flatMap((g) => g.figures.map((f) => f.nodeId)),
      ).toEqual(["sec"]);
      expect(book.overige.flatMap((r) => r.nodeIds)).toEqual(["sec2"]);
    });

    it("skips a key box that does not exist", () => {
      const nodes = explorerFixture.filter((n) => n.roleCode !== "PEN");
      const { keyGroups } = buildClubBook(nodes, []);

      expect(keyGroups[0]?.figures.map((f) => f.title)).toEqual([
        "Voorzitter",
        "Secretaris",
      ]);
    });

    it("shows the description as the why-line", () => {
      const nodes = [
        box("sec", "Secretaris", [person("a")], {
          roleCode: "SEC",
          description: "Post, verslagen, de vzw",
        }),
      ];

      expect(buildClubBook(nodes, []).keyGroups[0]?.figures[0]?.why).toBe(
        "Post, verslagen, de vzw",
      );
    });

    it.each([undefined, "", "   "])(
      "gives a key box with description %j no why-line, borrowing nothing",
      (description) => {
        const nodes = [
          box("sec", "Secretaris", [person("a")], {
            roleCode: "SEC",
            pillar: "bestuur",
            ...(description === undefined ? {} : { description }),
          }),
        ];

        const figure = buildClubBook(nodes, []).keyGroups[0]?.figures[0];
        expect(figure?.why).toBeUndefined();
      },
    );

    it("lists every holder of a shared key box and marks an empty one vacant", () => {
      const nodes = [
        box("gc", "GC", [person("a"), person("b")], { roleCode: "GC" }),
        box("api", "API", [], { roleCode: "API" }),
      ];

      const figures = buildClubBook(nodes, []).keyGroups.flatMap(
        (g) => g.figures,
      );
      expect(figures.find((f) => f.title === "GC")?.holders).toHaveLength(2);
      expect(figures.find((f) => f.title === "API")?.holders).toEqual([]);
    });
  });

  describe("raad van bestuur", () => {
    it("lists the members of the Bestuursorgaan box", () => {
      const nodes = [
        box("bst", "Bestuursorgaan", [person("a", "Ann"), person("b", "Bob")], {
          roleCode: "BST",
        }),
      ];

      const { raad } = buildClubBook(nodes, []);
      expect(raad?.nodeId).toBe("bst");
      expect(raad?.members.map((m) => m.name)).toEqual(["Ann", "Bob"]);
    });

    it("is absent without a Bestuursorgaan box or without members", () => {
      expect(buildClubBook([], []).raad).toBeUndefined();
      const empty = [box("bst", "Bestuursorgaan", [], { roleCode: "BST" })];
      expect(buildClubBook(empty, []).raad).toBeUndefined();
    });

    it("leaves an empty Bestuursorgaan box in a row, so it does not vanish", () => {
      const empty = [
        box("bst", "Bestuursorgaan", [], {
          roleCode: "BST",
          pillar: "bestuur",
        }),
      ];
      expect(buildClubBook(empty, []).overige.flatMap((r) => r.titles)).toEqual(
        ["Bestuursorgaan"],
      );
    });

    it("leaves a second Bestuursorgaan box in a row", () => {
      const nodes = [
        box("bst", "Bestuursorgaan", [person("a")], { roleCode: "BST" }),
        box("bst2", "Bestuursorgaan bis", [person("b")], { roleCode: "BST" }),
      ];
      const book = buildClubBook(nodes, []);
      expect(book.raad?.nodeId).toBe("bst");
      expect(book.overige.flatMap((r) => r.nodeIds)).toEqual(["bst2"]);
    });
  });

  describe("chapters", () => {
    it("renders the four chapters in order, Jeugd with its two sub-heads", () => {
      const { chapters } = buildClubBook(explorerFixture, []);

      expect(chapters.map((c) => c.title)).toEqual([
        "Sportief",
        "Jeugd",
        "Club & werking",
        "Integriteit",
      ]);
      expect(chapters.map((c) => c.sections.map((s) => s.heading))).toEqual([
        [undefined],
        ["Organisatie", "Opleiding"],
        [undefined],
        [undefined],
      ]);
      expect(chapters.every((c) => c.purpose.length > 0)).toBe(true);
    });

    it("places each box under the pillar an editor chose", () => {
      const book = buildClubBook(explorerFixture, []);

      expect(rowsOf(book, "sportief").flatMap((r) => r.titles)).toContain(
        "T1 A-elftal",
      );
      expect(rowsOf(book, "club").flatMap((r) => r.titles)).toContain("Kledij");
      expect(rowsOf(book, "integriteit").flatMap((r) => r.titles)).toEqual([
        "API (Aanspreekpunt Integriteit)",
        "Lid Ethische Commissie",
      ]);
      const jeugd = book.chapters.find((c) => c.key === "jeugd");
      expect(jeugd?.sections[0]?.rows.flatMap((r) => r.titles)).toContain(
        "Jeugdsecretaris & Afgevaardigden",
      );
      expect(jeugd?.sections[1]?.rows.flatMap((r) => r.titles)).toContain(
        "Keeperstrainer Jeugd",
      );
    });

    it("sends a box with no pillar to Overige functies, so nothing disappears", () => {
      const { overige } = buildClubBook(explorerFixture, []);

      expect(overige.flatMap((r) => r.titles)).toEqual([
        "Gedelegeerd Commissaris",
        "Studentenbegeleiding",
        "Spelersraad",
      ]);
    });

    it("sends a bestuur box that is neither a key figure nor the Raad to Overige functies", () => {
      const nodes = [
        box("x", "Bestuurslid", [person("a")], {
          roleCode: "BL",
          pillar: "bestuur",
        }),
      ];

      expect(buildClubBook(nodes, []).overige.flatMap((r) => r.titles)).toEqual(
        ["Bestuurslid"],
      );
    });

    it("links Jeugd to the jeugdbestuur page and no other chapter, and the key cards to the hoofdbestuur page", () => {
      const { chapters, boardLink } = buildClubBook(explorerFixture, []);

      expect(boardLink.href).toBe("/club/bestuur");
      expect(chapters.map((c) => c.boardLink?.href)).toEqual([
        undefined,
        "/club/jeugdbestuur",
        undefined,
        undefined,
      ]);
    });
  });

  describe("rows", () => {
    it("merges the boxes one person holds alone in the same list into one row", () => {
      const kevin = person("kevin", "Kevin");
      const nodes = [
        box("tvjo", "TVJO", [kevin], { pillar: "jeugd-opleiding" }),
        box("jc", "Jeugdcoördinator Onderbouw", [kevin], {
          pillar: "jeugd-opleiding",
        }),
        box("kt", "Keeperstrainer Jeugd", [person("louie")], {
          pillar: "jeugd-opleiding",
        }),
      ];

      const rows = rowsOf(buildClubBook(nodes, []), "jeugd");

      expect(rows.map((r) => [r.titles, r.nodeIds])).toEqual([
        [
          ["TVJO", "Jeugdcoördinator Onderbouw"],
          ["tvjo", "jc"],
        ],
        [["Keeperstrainer Jeugd"], ["kt"]],
      ]);
    });

    it("never merges a shared box, even when it includes someone already listed", () => {
      const kevin = person("kevin");
      const nodes = [
        box("web", "Website", [kevin], { pillar: "club" }),
        box("kle", "Kledij", [kevin, person("mike")], { pillar: "club" }),
        box("inf", "Infrastructuur", [kevin, person("mike")], {
          pillar: "club",
        }),
      ];

      expect(
        rowsOf(buildClubBook(nodes, []), "club").map((r) => r.titles),
      ).toEqual([["Website"], ["Kledij"], ["Infrastructuur"]]);
    });

    it("does not merge a person across two different lists", () => {
      const kevin = person("kevin");
      const nodes = [
        box("jbl", "Lid Jeugdbestuur", [kevin], {
          pillar: "jeugd-organisatie",
        }),
        box("tvjo", "TVJO", [kevin], { pillar: "jeugd-opleiding" }),
      ];

      const [organisatie, opleiding] =
        buildClubBook(nodes, []).chapters.find((c) => c.key === "jeugd")
          ?.sections ?? [];
      expect(organisatie?.rows).toHaveLength(1);
      expect(opleiding?.rows).toHaveLength(1);
    });

    it("puts vacant rows last, keeping the incoming order inside both groups", () => {
      const nodes = [
        box("a", "Scouting", [], { pillar: "sportief" }),
        box("b", "T1", [person("p1")], { pillar: "sportief" }),
        box("c", "Doorstroom", [], { pillar: "sportief" }),
        box("d", "T2", [person("p2")], { pillar: "sportief" }),
      ];

      const rows = rowsOf(buildClubBook(nodes, []), "sportief");

      expect(rows.map((r) => r.titles[0])).toEqual([
        "T1",
        "T2",
        "Scouting",
        "Doorstroom",
      ]);
      expect(rows.map((r) => r.holders.length > 0)).toEqual([
        true,
        true,
        false,
        false,
      ]);
    });
  });

  describe("in het bestuur", () => {
    const bst = box(
      "bst",
      "Bestuursorgaan",
      [person("ann", "Ann"), person("bob", "Bob"), person("cy", "Cy")],
      { roleCode: "BST", pillar: "bestuur" },
    );

    it("names the Raad members who hold a box in the pillar", () => {
      const nodes = [
        bst,
        box("kle", "Kledij", [person("ann", "Ann"), person("x")], {
          pillar: "club",
        }),
        box("t1", "T1", [person("bob", "Bob")], { pillar: "sportief" }),
      ];

      const { chapters } = buildClubBook(nodes, []);
      expect(chapters.map((c) => [c.key, c.board.map((m) => m.name)])).toEqual([
        ["sportief", ["Bob"]],
        ["jeugd", []],
        ["club", ["Ann"]],
        ["integriteit", []],
      ]);
    });

    it("counts a Raad member once across both Jeugd lists", () => {
      const nodes = [
        bst,
        box("jbl", "Lid Jeugdbestuur", [person("ann", "Ann")], {
          pillar: "jeugd-organisatie",
        }),
        box("tvjo", "TVJO", [person("ann", "Ann")], {
          pillar: "jeugd-opleiding",
        }),
      ];

      const jeugd = buildClubBook(nodes, []).chapters.find(
        (p) => p.key === "jeugd",
      );
      expect(jeugd?.board.map((m) => m.name)).toEqual(["Ann"]);
    });
  });

  describe("questions a holder answers in this role", () => {
    const shauni = person("shauni", "Shauni");
    const dennis = person("dennis", "Dennis");
    const nodes = [
      box("gdpr", "GDPR", [shauni], { pillar: "jeugd-organisatie" }),
      box("kan", "Kantinedienst", [shauni, dennis], {
        pillar: "jeugd-organisatie",
      }),
    ];
    const paths = [
      question("privacy", "gdpr", [shauni]),
      question("kantine-open", "kan", [shauni, dennis]),
      question("kantine-hulp", "kan", [shauni, dennis]),
    ];

    const holdersOf = (title: string) =>
      rowsOf(buildClubBook(nodes, paths), "jeugd")
        .find((r) => r.titles.includes(title))
        ?.holders.map((h) => [h.name, h.questions.map((q) => q.id)]);

    it("keeps Shauni's GDPR question off her Kantinedienst row", () => {
      expect(holdersOf("GDPR")).toEqual([["Shauni", ["privacy"]]]);
      expect(holdersOf("Kantinedienst")?.[0]).toEqual([
        "Shauni",
        ["kantine-open", "kantine-hulp"],
      ]);
    });

    it("gives every holder of a shared box the box's questions", () => {
      expect(holdersOf("Kantinedienst")?.[1]).toEqual([
        "Dennis",
        ["kantine-open", "kantine-hulp"],
      ]);
    });

    it("carries the question text for the link into the finder", () => {
      const row = rowsOf(buildClubBook(nodes, paths), "jeugd")[0];
      expect(row?.holders[0]?.questions).toEqual([
        { id: "privacy", question: "vraag privacy" },
      ]);
    });

    it("ignores questions whose primary contact is not a position", () => {
      const manual = [question("m", "gdpr", [shauni], "manual")];
      const row = rowsOf(buildClubBook(nodes, manual), "jeugd")[0];
      expect(row?.holders[0]?.questions).toEqual([]);
    });

    it("unites the questions of every box merged into one row", () => {
      const merged = [
        box("a", "TVJO", [shauni], { pillar: "jeugd-opleiding" }),
        box("b", "JC", [shauni], { pillar: "jeugd-opleiding" }),
      ];
      const both = [
        question("qa", "a", [shauni]),
        question("qb", "b", [shauni]),
      ];

      const row = rowsOf(buildClubBook(merged, both), "jeugd")[0];
      expect(row?.holders[0]?.questions.map((q) => q.id)).toEqual(["qa", "qb"]);
    });
  });

  describe("holders without a name", () => {
    const nameless = { id: "ghost" };

    it("treats a box held only by a nameless person as vacant", () => {
      const nodes = [
        box("a", "Scouting", [nameless], { pillar: "sportief" }),
        box("b", "T1", [person("p1", "Piet")], { pillar: "sportief" }),
      ];

      const rows = rowsOf(buildClubBook(nodes, []), "sportief");
      expect(rows.map((r) => [r.titles[0], r.holders.length])).toEqual([
        ["T1", 1],
        ["Scouting", 0],
      ]);
    });

    it("drops them from a shared box's names and from the Raad", () => {
      const nodes = [
        box("bst", "Bestuursorgaan", [nameless, person("a", "Ann")], {
          roleCode: "BST",
        }),
        box("kan", "Kantine", [person("a", "Ann"), nameless], {
          pillar: "club",
        }),
      ];

      const book = buildClubBook(nodes, []);
      expect(joinNames(book.raad?.members ?? [])).toBe("Ann");
      expect(rowsOf(book, "club")[0]?.holders.map((h) => h.name)).toEqual([
        "Ann",
      ]);
    });
  });
});

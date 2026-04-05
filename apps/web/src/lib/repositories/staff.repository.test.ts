import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type {
  ORGANIGRAM_NODES_QUERY_RESULT,
  STAFF_MEMBER_BY_PSD_ID_QUERY_RESULT,
  STAFF_MEMBERS_PSDID_QUERY_RESULT,
} from "../sanity/sanity.types";
import type { OrgChartNode } from "@/types/organigram";

// Mock the sanity client before importing the repository
vi.mock("../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

import { sanityClient } from "../sanity/client";
import {
  StaffRepository,
  StaffRepositoryLive,
  toOrgChartNode,
  toKeyContactVMs,
  type StaffDetailVM,
  type KeyContactVM,
} from "./staff.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(effect: Effect.Effect<A, never, StaffRepository>) {
  return Effect.runPromise(Effect.provide(effect, StaffRepositoryLive));
}

type NodeRow = ORGANIGRAM_NODES_QUERY_RESULT[number];

function makeNodeRow(overrides: Partial<NodeRow> = {}): NodeRow {
  return {
    _id: "node-1",
    title: "Voorzitter",
    description: "Algemene leiding",
    roleCode: "VZ",
    department: "hoofdbestuur",
    parentId: null,
    members: [
      {
        id: "staff-1",
        name: "Jan Janssens",
        imageUrl: "https://cdn.sanity.io/photo.webp",
        email: "jan@kcvv.be",
        phone: "+32 123 456 789",
        psdId: "42",
      },
    ],
    ...overrides,
  };
}

describe("toOrgChartNode", () => {
  it("maps all OrgChartNode fields from an organigramNode row", () => {
    const row = makeNodeRow();
    const result = toOrgChartNode(row);

    expect(result).toEqual<OrgChartNode>({
      id: "node-1",
      title: "Voorzitter",
      description: "Algemene leiding",
      roleCode: "VZ",
      department: "hoofdbestuur",
      parentId: "club",
      members: [
        {
          id: "staff-1",
          name: "Jan Janssens",
          imageUrl: "https://cdn.sanity.io/photo.webp",
          email: "jan@kcvv.be",
          phone: "+32 123 456 789",
          href: "/staf/42",
        },
      ],
    });
  });

  it("null parentId defaults to 'club'", () => {
    const result = toOrgChartNode(makeNodeRow({ parentId: null }));
    expect(result.parentId).toBe("club");
  });

  it("explicit parentId is preserved", () => {
    const result = toOrgChartNode(makeNodeRow({ parentId: "parent-node-1" }));
    expect(result.parentId).toBe("parent-node-1");
  });

  it("null optional node fields become undefined", () => {
    const result = toOrgChartNode(
      makeNodeRow({ roleCode: null, description: null, department: null }),
    );
    expect(result.roleCode).toBeUndefined();
    expect(result.description).toBeUndefined();
    expect(result.department).toBeUndefined();
  });

  it("null members array becomes empty array", () => {
    const result = toOrgChartNode(makeNodeRow({ members: null }));
    expect(result.members).toEqual([]);
  });

  it("null optional member fields become undefined", () => {
    const result = toOrgChartNode(
      makeNodeRow({
        members: [
          {
            id: "staff-1",
            name: "Jan Janssens",
            imageUrl: null,
            email: null,
            phone: null,
            psdId: null,
          },
        ],
      }),
    );
    const member = result.members[0];
    expect(member.imageUrl).toBeUndefined();
    expect(member.email).toBeUndefined();
    expect(member.phone).toBeUndefined();
    expect(member.href).toBeUndefined();
  });

  it("numeric psdId is coerced to string for href", () => {
    const result = toOrgChartNode(
      makeNodeRow({
        members: [
          {
            id: "staff-1",
            name: "Jan Janssens",
            imageUrl: null,
            email: null,
            phone: null,
            psdId: 42 as unknown as string,
          },
        ],
      }),
    );
    expect(result.members[0].href).toBe("/staf/42");
  });

  it("whitespace-only name collapses to undefined and psdId is trimmed in href", () => {
    const result = toOrgChartNode(
      makeNodeRow({
        members: [
          {
            id: "staff-1",
            name: " ",
            imageUrl: null,
            email: null,
            phone: null,
            psdId: " 42 ",
          },
        ],
      }),
    );
    const member = result.members[0];
    expect(member.name).toBeUndefined();
    expect(member.href).toBe("/staf/42");
  });
});

describe("toKeyContactVMs", () => {
  it("maps a node row to KeyContactVM entries", () => {
    const rows = [
      {
        title: "Voorzitter",
        roleCode: "voorzitter",
        members: [{ name: "Jan Janssens", email: "jan@kcvv.be" }],
      },
    ];
    expect(toKeyContactVMs(rows)).toEqual<KeyContactVM[]>([
      { role: "Voorzitter", name: "Jan Janssens", email: "jan@kcvv.be" },
    ]);
  });

  it("trims whitespace from member names", () => {
    const rows = [
      {
        title: "Secretaris",
        roleCode: "secretaris",
        members: [{ name: " Piet Pieters ", email: "piet@kcvv.be" }],
      },
    ];
    expect(toKeyContactVMs(rows)[0].name).toBe("Piet Pieters");
  });

  it("uses role title as fallback when name is whitespace-only", () => {
    const rows = [
      {
        title: "Voorzitter",
        roleCode: "voorzitter",
        members: [{ name: "  ", email: "voorzitter@kcvv.be" }],
      },
    ];
    expect(toKeyContactVMs(rows)[0].name).toBe("Voorzitter");
  });

  it("null title defaults to empty string for role", () => {
    const rows = [
      {
        title: null as unknown as string,
        roleCode: "voorzitter",
        members: [{ name: "Jan", email: "jan@kcvv.be" }],
      },
    ];
    expect(toKeyContactVMs(rows)[0].role).toBe("");
  });
});

describe("StaffRepository", () => {
  describe("findAll", () => {
    it("prepends CLUB_ROOT_NODE and maps all OrgChartNode fields", async () => {
      const row = makeNodeRow();
      mockFetch.mockResolvedValueOnce([row]);

      const nodes = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findAll();
        }),
      );

      expect(nodes).toHaveLength(2);

      // First element is the club root node
      expect(nodes[0]).toEqual<OrgChartNode>({
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
      });

      // Second element is the mapped organigram node
      expect(nodes[1]).toEqual<OrgChartNode>({
        id: "node-1",
        title: "Voorzitter",
        description: "Algemene leiding",
        roleCode: "VZ",
        department: "hoofdbestuur",
        parentId: "club",
        members: [
          {
            id: "staff-1",
            name: "Jan Janssens",
            imageUrl: "https://cdn.sanity.io/photo.webp",
            email: "jan@kcvv.be",
            phone: "+32 123 456 789",
            href: "/staf/42",
          },
        ],
      });
    });

    it("parentId null defaults to 'club'", async () => {
      mockFetch.mockResolvedValueOnce([makeNodeRow({ parentId: null })]);

      const nodes = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findAll();
        }),
      );

      expect(nodes[1].parentId).toBe("club");
    });

    it("parentId set when parent node exists", async () => {
      mockFetch.mockResolvedValueOnce([
        makeNodeRow({ _id: "parent-1", parentId: null }),
        makeNodeRow({ _id: "child-1", parentId: "parent-1" }),
      ]);

      const nodes = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findAll();
        }),
      );

      const child = nodes.find((n) => n.id === "child-1");
      expect(child?.parentId).toBe("parent-1");
    });
  });

  describe("findByPsdId", () => {
    type DetailRow = NonNullable<STAFF_MEMBER_BY_PSD_ID_QUERY_RESULT>;

    function makeDetailRow(overrides: Partial<DetailRow> = {}): DetailRow {
      return {
        _id: "staff-1",
        psdId: "psd-42",
        firstName: "Jan",
        lastName: "Janssens",
        email: "jan@kcvv.be",
        phone: "+32 123 456 789",
        bio: null,
        photoUrl: "https://cdn.sanity.io/photo.webp",
        organigramPositions: [],
        responsibilityPaths: [],
        ...overrides,
      };
    }

    it("maps all StaffDetailVM fields from GROQ result", async () => {
      mockFetch.mockResolvedValueOnce(makeDetailRow());

      const member = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findByPsdId("psd-42");
        }),
      );

      expect(member).toEqual<StaffDetailVM>({
        id: "staff-1",
        psdId: "psd-42",
        firstName: "Jan",
        lastName: "Janssens",
        email: "jan@kcvv.be",
        phone: "+32 123 456 789",
        bio: undefined,
        imageUrl: "https://cdn.sanity.io/photo.webp",
        href: "/staf/psd-42",
        organigramPositions: [],
        responsibilityPaths: [],
      });
    });

    it("returns null when Sanity returns null", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const member = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findByPsdId("unknown");
        }),
      );

      expect(member).toBeNull();
    });

    it("maps organigram positions to VM", async () => {
      mockFetch.mockResolvedValueOnce(
        makeDetailRow({
          organigramPositions: [
            {
              _id: "org-1",
              title: "Voorzitter",
              roleCode: "VZ",
              department: "hoofdbestuur",
            },
            {
              _id: "org-2",
              title: "Sportief Verantwoordelijke",
              roleCode: null,
              department: null,
            },
          ],
        }),
      );

      const member = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findByPsdId("psd-42");
        }),
      );

      expect(member?.organigramPositions).toEqual([
        {
          _id: "org-1",
          title: "Voorzitter",
          roleCode: "VZ",
          department: "hoofdbestuur",
        },
        { _id: "org-2", title: "Sportief Verantwoordelijke" },
      ]);
    });

    it("maps responsibility paths to VM", async () => {
      mockFetch.mockResolvedValueOnce(
        makeDetailRow({
          responsibilityPaths: [
            {
              title: "Blessure melden",
              slug: "blessure-melden",
              category: "medisch",
              icon: "activity",
            },
            {
              title: "Lidgeld betalen",
              slug: "lidgeld-betalen",
              category: "administratief",
              icon: null,
            },
          ],
        }),
      );

      const member = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findByPsdId("psd-42");
        }),
      );

      expect(member?.responsibilityPaths).toEqual([
        {
          title: "Blessure melden",
          slug: "blessure-melden",
          category: "medisch",
          icon: "activity",
        },
        {
          title: "Lidgeld betalen",
          slug: "lidgeld-betalen",
          category: "administratief",
        },
      ]);
    });

    it("empty organigram positions and responsibility paths become empty arrays", async () => {
      mockFetch.mockResolvedValueOnce(makeDetailRow());

      const member = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findByPsdId("psd-42");
        }),
      );

      expect(member?.organigramPositions).toEqual([]);
      expect(member?.responsibilityPaths).toEqual([]);
    });

    it("null organigram positions and responsibility paths from Sanity become empty arrays", async () => {
      mockFetch.mockResolvedValueOnce(
        makeDetailRow({
          organigramPositions: null as unknown as [],
          responsibilityPaths: null as unknown as [],
        }),
      );

      const member = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findByPsdId("psd-42");
        }),
      );

      expect(member?.organigramPositions).toEqual([]);
      expect(member?.responsibilityPaths).toEqual([]);
    });

    it("null optional fields become undefined", async () => {
      mockFetch.mockResolvedValueOnce(
        makeDetailRow({
          email: null,
          phone: null,
          photoUrl: null,
          bio: null,
        }),
      );

      const member = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findByPsdId("psd-42");
        }),
      );

      expect(member?.email).toBeUndefined();
      expect(member?.phone).toBeUndefined();
      expect(member?.imageUrl).toBeUndefined();
      expect(member?.bio).toBeUndefined();
    });
  });

  describe("findKeyContacts", () => {
    it("returns key contacts with role, name, and email", async () => {
      mockFetch.mockResolvedValueOnce([
        {
          title: "Voorzitter",
          roleCode: "voorzitter",
          members: [{ name: "Jan Janssens", email: "jan@kcvv.be" }],
        },
        {
          title: "Secretaris",
          roleCode: "secretaris",
          members: [{ name: "Piet Pieters", email: "piet@kcvv.be" }],
        },
      ]);

      const contacts = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findKeyContacts();
        }),
      );

      expect(contacts).toEqual<KeyContactVM[]>([
        { role: "Voorzitter", name: "Jan Janssens", email: "jan@kcvv.be" },
        { role: "Secretaris", name: "Piet Pieters", email: "piet@kcvv.be" },
      ]);
    });

    it("flattens multiple members per node into separate contacts", async () => {
      mockFetch.mockResolvedValueOnce([
        {
          title: "Jeugdcoördinator",
          roleCode: "jeugdcoordinator",
          members: [
            { name: "An Anssens", email: "an@kcvv.be" },
            { name: "Bea Boons", email: "bea@kcvv.be" },
          ],
        },
      ]);

      const contacts = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findKeyContacts();
        }),
      );

      expect(contacts).toHaveLength(2);
      expect(contacts[0].name).toBe("An Anssens");
      expect(contacts[1].name).toBe("Bea Boons");
    });

    it("returns empty array when no key contacts exist", async () => {
      mockFetch.mockResolvedValueOnce([]);

      const contacts = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findKeyContacts();
        }),
      );

      expect(contacts).toEqual([]);
    });
  });

  describe("findAllForStaticParams", () => {
    it("returns psdId for all non-archived staff with psdId", async () => {
      const rows: STAFF_MEMBERS_PSDID_QUERY_RESULT = [
        { _id: "s1", psdId: "psd-1" },
        { _id: "s2", psdId: "psd-2" },
      ];
      mockFetch.mockResolvedValueOnce(rows);

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findAllForStaticParams();
        }),
      );

      expect(result).toEqual([{ psdId: "psd-1" }, { psdId: "psd-2" }]);
    });

    it("coerces numeric psdId to string", async () => {
      const rows = [{ _id: "s1", psdId: 123 as unknown as string }];
      mockFetch.mockResolvedValueOnce(rows);

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findAllForStaticParams();
        }),
      );

      expect(result).toEqual([{ psdId: "123" }]);
      expect(typeof result[0].psdId).toBe("string");
    });

    it("filters out rows with null psdId", async () => {
      const rows: STAFF_MEMBERS_PSDID_QUERY_RESULT = [
        { _id: "s1", psdId: "psd-1" },
        { _id: "s2", psdId: null },
      ];
      mockFetch.mockResolvedValueOnce(rows);

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findAllForStaticParams();
        }),
      );

      expect(result).toEqual([{ psdId: "psd-1" }]);
    });
  });
});

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
  type StaffDetailVM,
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
        role: "voorzitter",
        roleLabel: "Voorzitter",
        department: "hoofdbestuur",
        email: "jan@kcvv.be",
        phone: "+32 123 456 789",
        bio: null,
        photoUrl: "https://cdn.sanity.io/photo.webp",
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
        roleDisplay: "Voorzitter",
        roleLabel: "Voorzitter",
        departmentDisplay: "Hoofdbestuur",
        email: "jan@kcvv.be",
        phone: "+32 123 456 789",
        bio: undefined,
        imageUrl: "https://cdn.sanity.io/photo.webp",
        href: "/staf/psd-42",
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

    it("maps role enum to display label", async () => {
      mockFetch.mockResolvedValueOnce(makeDetailRow({ role: "hoofdtrainer" }));

      const member = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findByPsdId("psd-42");
        }),
      );

      expect(member?.roleDisplay).toBe("Hoofdtrainer");
    });

    it("maps unknown role to roleLabel fallback", async () => {
      mockFetch.mockResolvedValueOnce(
        makeDetailRow({ role: null, roleLabel: "Custom Title" }),
      );

      const member = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findByPsdId("psd-42");
        }),
      );

      expect(member?.roleDisplay).toBe("Custom Title");
    });

    it("maps department to display label", async () => {
      mockFetch.mockResolvedValueOnce(
        makeDetailRow({ department: "jeugdbestuur" }),
      );

      const member = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findByPsdId("psd-42");
        }),
      );

      expect(member?.departmentDisplay).toBe("Jeugdbestuur");
    });

    it("null optional fields become undefined", async () => {
      mockFetch.mockResolvedValueOnce(
        makeDetailRow({
          email: null,
          phone: null,
          photoUrl: null,
          bio: null,
          department: null,
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
      expect(member?.departmentDisplay).toBeUndefined();
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

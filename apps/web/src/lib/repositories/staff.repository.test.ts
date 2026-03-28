import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type {
  STAFF_MEMBERS_QUERY_RESULT,
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
  type StaffDetailVM,
} from "./staff.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(effect: Effect.Effect<A, never, StaffRepository>) {
  return Effect.runPromise(Effect.provide(effect, StaffRepositoryLive));
}

type StaffRow = STAFF_MEMBERS_QUERY_RESULT[number];

function makeStaffRow(overrides: Partial<StaffRow> = {}): StaffRow {
  return {
    _id: "staff-1",
    firstName: "Jan",
    lastName: "Janssens",
    roleLabel: "Voorzitter",
    roleCode: "VZ",
    department: "hoofdbestuur",
    email: "jan@kcvv.be",
    phone: "+32 123 456 789",
    photoUrl: "https://cdn.sanity.io/photo.webp",
    responsibilities: "Algemene leiding",
    parentId: null,
    ...overrides,
  };
}

describe("StaffRepository", () => {
  describe("findAll", () => {
    it("prepends CLUB_ROOT_NODE and maps all OrgChartNode fields", async () => {
      const row = makeStaffRow();
      mockFetch.mockResolvedValueOnce([row]);

      const members = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findAll();
        }),
      );

      expect(members).toHaveLength(2);

      // First element is the club root node
      expect(members[0]).toEqual<OrgChartNode>({
        id: "club",
        name: "KCVV Elewijt",
        title: "Voetbalclub",
        imageUrl: "/images/logo-flat.png",
        department: "algemeen",
        parentId: null,
      });

      // Second element is the mapped staff member
      expect(members[1]).toEqual<OrgChartNode>({
        id: "staff-1",
        name: "Jan Janssens",
        title: "Voorzitter",
        roleCode: "VZ",
        imageUrl: "https://cdn.sanity.io/photo.webp",
        email: "jan@kcvv.be",
        phone: "+32 123 456 789",
        responsibilities: "Algemene leiding",
        department: "hoofdbestuur",
        parentId: "club",
      });
    });

    it("parentId null defaults to 'club'", async () => {
      mockFetch.mockResolvedValueOnce([makeStaffRow({ parentId: null })]);

      const members = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findAll();
        }),
      );

      expect(members[1].parentId).toBe("club");
    });

    it("parentId set when parent is in organigram", async () => {
      mockFetch.mockResolvedValueOnce([
        makeStaffRow({ _id: "parent-1", parentId: null }),
        makeStaffRow({ _id: "child-1", parentId: "parent-1" }),
      ]);

      const members = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findAll();
        }),
      );

      const child = members.find((m) => m.id === "child-1");
      expect(child?.parentId).toBe("parent-1");
    });

    it("null optional fields become undefined", async () => {
      mockFetch.mockResolvedValueOnce([
        makeStaffRow({
          roleCode: null,
          photoUrl: null,
          email: null,
          phone: null,
          responsibilities: null,
          department: null,
        }),
      ]);

      const members = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findAll();
        }),
      );

      const member = members[1];
      expect(member.roleCode).toBeUndefined();
      expect(member.imageUrl).toBeUndefined();
      expect(member.email).toBeUndefined();
      expect(member.phone).toBeUndefined();
      expect(member.responsibilities).toBeUndefined();
      expect(member.department).toBeUndefined();
    });

    it("null firstName/lastName produce trimmed name", async () => {
      mockFetch.mockResolvedValueOnce([
        makeStaffRow({ firstName: null, lastName: "Janssens" }),
      ]);

      const members = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findAll();
        }),
      );

      expect(members[1].name).toBe("Janssens");
    });

    it("null roleLabel defaults to empty string", async () => {
      mockFetch.mockResolvedValueOnce([makeStaffRow({ roleLabel: null })]);

      const members = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* StaffRepository;
          return yield* repo.findAll();
        }),
      );

      expect(members[1].title).toBe("");
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

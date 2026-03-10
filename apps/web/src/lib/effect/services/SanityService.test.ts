import { describe, it, expect, vi, type Mock } from "vitest";
import { Effect } from "effect";
import { SanityService, SanityServiceLive } from "./SanityService";
import { sanityClient } from "../../sanity/client";

vi.mock("../../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn().mockResolvedValue([
      {
        _id: "player-psd-42",
        psdId: "42",
        firstName: "Jan",
        lastName: "Janssen",
        keeper: false,
        positionPsd: null,
        position: "Middenvelder",
        transparentImageUrl: null,
        celebrationImageUrl: null,
        psdImageUrl: null,
        bio: null,
        birthDate: "1995-01-15",
        nationality: null,
        jerseyNumber: null,
        height: null,
        weight: null,
      },
    ]),
  },
}));

function mockFetch(value: unknown) {
  (vi.mocked(sanityClient.fetch) as Mock).mockResolvedValueOnce(value);
}

describe("SanityService.getPlayers", () => {
  it("returns players from Sanity", async () => {
    const program = Effect.gen(function* () {
      const svc = yield* SanityService;
      return yield* svc.getPlayers();
    }).pipe(Effect.provide(SanityServiceLive));

    const players = await Effect.runPromise(program);
    expect(players).toHaveLength(1);
    expect(players[0]?.psdId).toBe("42");
  });
});

describe("SanityService.getStaffMembers", () => {
  it("prepends the club root node and maps a staffMember doc to OrgChartNode", async () => {
    mockFetch([
      {
        _id: "staffMember-psd-42",
        firstName: "Jan",
        lastName: "Smeets",
        positionTitle: "Jeugdcoördinator",
        positionShort: "JC",
        department: "jeugdbestuur",
        email: "jeugd@kcvvelewijt.be",
        phone: null,
        photoUrl: "https://cdn.sanity.io/images/test/photo.jpg",
        responsibilities: "Coördinatie jeugdwerking",
        parentId: null,
      },
    ]);

    const program = Effect.gen(function* () {
      const svc = yield* SanityService;
      return yield* svc.getStaffMembers();
    }).pipe(Effect.provide(SanityServiceLive));

    const nodes = await Effect.runPromise(program);

    expect(nodes[0]?.id).toBe("club");
    expect(nodes[0]?.name).toBe("KCVV Elewijt");
    expect(nodes[0]?.parentId).toBeNull();

    expect(nodes[1]?.id).toBe("staffMember-psd-42");
    expect(nodes[1]?.name).toBe("Jan Smeets");
    expect(nodes[1]?.title).toBe("Jeugdcoördinator");
    expect(nodes[1]?.positionShort).toBe("JC");
    expect(nodes[1]?.parentId).toBe("club"); // null parentId → root → "club"
    expect(nodes[1]?.imageUrl).toBe(
      "https://cdn.sanity.io/images/test/photo.jpg",
    );
    expect(nodes[1]?.responsibilities).toBe("Coördinatie jeugdwerking");
  });

  it("preserves parentId when parentMember is set", async () => {
    mockFetch([
      {
        _id: "staffMember-psd-1",
        firstName: "Root",
        lastName: "Person",
        positionTitle: "Voorzitter",
        positionShort: "PRES",
        department: "hoofdbestuur",
        email: null,
        phone: null,
        photoUrl: null,
        responsibilities: null,
        parentId: null,
      },
      {
        _id: "staffMember-psd-2",
        firstName: "Child",
        lastName: "Person",
        positionTitle: "Secretaris",
        positionShort: "SEC",
        department: "hoofdbestuur",
        email: null,
        phone: null,
        photoUrl: null,
        responsibilities: null,
        parentId: "staffMember-psd-1",
      },
    ]);

    const program = Effect.gen(function* () {
      const svc = yield* SanityService;
      return yield* svc.getStaffMembers();
    }).pipe(Effect.provide(SanityServiceLive));

    const nodes = await Effect.runPromise(program);
    // nodes[0]=club root, nodes[1]=Root Person, nodes[2]=Child Person
    expect(nodes[2]?.parentId).toBe("staffMember-psd-1");
  });
});

describe("SanityService.getResponsibilityPaths — memberId", () => {
  it("forwards memberId from staffMember reference", async () => {
    mockFetch([
      {
        id: "test-path",
        role: ["ouder"],
        question: "Wie contacteer ik?",
        keywords: ["contact"],
        summary: "Contacteer de coördinator.",
        category: "algemeen",
        icon: null,
        primaryContact: {
          role: "Jeugdcoördinator",
          email: "jeugd@kcvvelewijt.be",
          phone: null,
          department: "jeugdbestuur",
          name: "Jan Smeets",
          memberId: "staffMember-psd-42",
        },
        steps: [],
        relatedPaths: [],
      },
    ]);

    const program = Effect.gen(function* () {
      const svc = yield* SanityService;
      return yield* svc.getResponsibilityPaths();
    }).pipe(Effect.provide(SanityServiceLive));

    const paths = await Effect.runPromise(program);
    expect(paths[0]?.primaryContact.memberId).toBe("staffMember-psd-42");
  });
});

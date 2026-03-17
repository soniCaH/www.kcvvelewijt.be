import { describe, it, expect, vi, type Mock } from "vitest";
import { Effect } from "effect";
import { SanityService, SanityServiceLive } from "./SanityService";
import { sanityClient } from "../../sanity/client";
import { STAFF_MEMBERS_QUERY } from "../../sanity/queries/staffMembers";
import { RESPONSIBILITY_PATHS_QUERY } from "../../sanity/queries/responsibilityPaths";
import { PAGE_BY_SLUG_QUERY } from "../../sanity/queries/pages";

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

    expect(vi.mocked(sanityClient.fetch)).toHaveBeenCalledWith(
      STAFF_MEMBERS_QUERY,
      expect.any(Object),
    );

    expect(nodes[0]).toEqual({
      id: "club",
      name: "KCVV Elewijt",
      title: "Voetbalclub",
      imageUrl: "/images/logo-flat.png",
      department: "algemeen",
      parentId: null,
    });

    expect(nodes[1]).toEqual({
      id: "staffMember-psd-42",
      name: "Jan Smeets",
      title: "Jeugdcoördinator",
      positionShort: "JC",
      imageUrl: "https://cdn.sanity.io/images/test/photo.jpg",
      email: "jeugd@kcvvelewijt.be",
      phone: undefined,
      responsibilities: "Coördinatie jeugdwerking",
      department: "jeugdbestuur",
      parentId: "club", // null parentId → root → "club"
    });
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

    expect(vi.mocked(sanityClient.fetch)).toHaveBeenCalledWith(
      RESPONSIBILITY_PATHS_QUERY,
      expect.any(Object),
    );

    expect(paths[0]?.primaryContact.memberId).toBe("staffMember-psd-42");
  });
});

describe("SanityService.getPage", () => {
  it("returns a SanityPage when found", async () => {
    const mockPage = {
      _id: "page-123",
      title: "Praktische Info",
      slug: { current: "register" },
      body: [{ _type: "block", children: [{ text: "Hello" }] }],
    };
    mockFetch(mockPage);

    const program = Effect.gen(function* () {
      const svc = yield* SanityService;
      return yield* svc.getPage("register");
    }).pipe(Effect.provide(SanityServiceLive));

    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?._id).toBe("page-123");
    expect(result?.title).toBe("Praktische Info");
    expect(vi.mocked(sanityClient.fetch)).toHaveBeenCalledWith(
      PAGE_BY_SLUG_QUERY,
      expect.objectContaining({ slug: "register" }),
    );
  });

  it("returns null when page not found", async () => {
    mockFetch(null);

    const program = Effect.gen(function* () {
      const svc = yield* SanityService;
      return yield* svc.getPage("unknown-slug");
    }).pipe(Effect.provide(SanityServiceLive));

    const result = await Effect.runPromise(program);

    expect(result).toBeNull();
  });
});

describe("SanityService.getNextFeaturedEvent", () => {
  it("returns the next event with featuredOnHome=true when present", async () => {
    const mockEvent = {
      _id: "event-1",
      title: "Sponsorfeest",
      dateStart: "2026-04-26T19:00:00.000Z",
      dateEnd: null,
      externalLink: { url: "https://fb.com", label: "Facebook" },
      coverImageUrl: "https://cdn.sanity.io/img.jpg",
      featuredOnHome: true,
    };
    mockFetch(mockEvent);
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* SanityService;
        return yield* svc.getNextFeaturedEvent();
      }).pipe(Effect.provide(SanityServiceLive)),
    );
    expect(result).not.toBeNull();
    expect(result?._id).toBe("event-1");
  });

  it("returns null when no upcoming events exist", async () => {
    mockFetch(null);
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* SanityService;
        return yield* svc.getNextFeaturedEvent();
      }).pipe(Effect.provide(SanityServiceLive)),
    );
    expect(result).toBeNull();
  });
});

describe("SanityService.getHomepageBanners", () => {
  it("returns resolved banner data from homepage singleton", async () => {
    mockFetch({
      bannerSlotA: {
        _id: "b1",
        imageUrl: "/img.jpg",
        alt: "Anti-racism",
        href: null,
      },
      bannerSlotB: null,
      bannerSlotC: null,
    });
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* SanityService;
        return yield* svc.getHomepageBanners();
      }).pipe(Effect.provide(SanityServiceLive)),
    );
    expect(result.bannerSlotA).not.toBeNull();
    expect(result.bannerSlotB).toBeNull();
  });

  it("returns all-null banners when homepage doc is missing", async () => {
    mockFetch(null);
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* SanityService;
        return yield* svc.getHomepageBanners();
      }).pipe(Effect.provide(SanityServiceLive)),
    );
    expect(result).toEqual({
      bannerSlotA: null,
      bannerSlotB: null,
      bannerSlotC: null,
    });
  });
});

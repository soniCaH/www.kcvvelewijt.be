/**
 * Tests for Organigram Utility Functions
 */

import { describe, it, expect } from "vitest";
import type { OrgChartNode } from "@/types/organigram";
import {
  findMemberById,
  findDirectChildren,
  findParent,
  getAncestors,
  buildOrganigramUrl,
  parseOrganigramParams,
} from "./organigram-utils";

// Mock organigram data for testing
const mockMembers: OrgChartNode[] = [
  {
    id: "club",
    name: "KCVV Elewijt",
    title: "Voetbalclub",
    department: "algemeen",
    parentId: null,
  },
  {
    id: "president",
    name: "John Doe",
    title: "Voorzitter",
    department: "hoofdbestuur",
    parentId: "club",
    email: "president@test.com",
  },
  {
    id: "secretary",
    name: "Jane Smith",
    title: "Secretaris",
    department: "hoofdbestuur",
    parentId: "president",
    email: "secretary@test.com",
  },
  {
    id: "treasurer",
    name: "Bob Johnson",
    title: "Penningmeester",
    department: "hoofdbestuur",
    parentId: "president",
    phone: "0123456789",
  },
  {
    id: "jeugdcoordinator",
    name: "Alice Brown",
    title: "Jeugdcoördinator",
    department: "jeugdbestuur",
    parentId: "president",
  },
  {
    id: "team-manager",
    name: "Charlie Wilson",
    title: "Teammanager",
    department: "jeugdbestuur",
    parentId: "jeugdcoordinator",
  },
];

describe("findMemberById", () => {
  it("should find a member by valid ID", () => {
    const result = findMemberById(mockMembers, "president");

    expect(result).toBeDefined();
    expect(result?.id).toBe("president");
    expect(result?.name).toBe("John Doe");
  });

  it("should return undefined for non-existent ID", () => {
    const result = findMemberById(mockMembers, "non-existent");

    expect(result).toBeUndefined();
  });

  it("should return undefined for null ID", () => {
    const result = findMemberById(mockMembers, null);

    expect(result).toBeUndefined();
  });

  it("should return undefined for undefined ID", () => {
    const result = findMemberById(mockMembers, undefined);

    expect(result).toBeUndefined();
  });

  it("should return undefined for empty string ID", () => {
    const result = findMemberById(mockMembers, "");

    expect(result).toBeUndefined();
  });

  it("should handle empty members array", () => {
    const result = findMemberById([], "president");

    expect(result).toBeUndefined();
  });
});

describe("findDirectChildren", () => {
  it("should find all direct children of a parent", () => {
    const children = findDirectChildren(mockMembers, "president");

    expect(children).toHaveLength(3);
    expect(children.map((c) => c.id)).toEqual(
      expect.arrayContaining(["secretary", "treasurer", "jeugdcoordinator"]),
    );
  });

  it("should return empty array for member with no children", () => {
    const children = findDirectChildren(mockMembers, "team-manager");

    expect(children).toHaveLength(0);
  });

  it("should return empty array for non-existent parent", () => {
    const children = findDirectChildren(mockMembers, "non-existent");

    expect(children).toHaveLength(0);
  });

  it("should return empty array for null parentId", () => {
    const children = findDirectChildren(mockMembers, null);

    expect(children).toHaveLength(0);
  });

  it("should return empty array for undefined parentId", () => {
    const children = findDirectChildren(mockMembers, undefined);

    expect(children).toHaveLength(0);
  });

  it("should find root-level children", () => {
    const children = findDirectChildren(mockMembers, "club");

    expect(children).toHaveLength(1);
    expect(children[0].id).toBe("president");
  });
});

describe("findParent", () => {
  it("should find the parent of a member", () => {
    const parent = findParent(mockMembers, "secretary");

    expect(parent).toBeDefined();
    expect(parent?.id).toBe("president");
  });

  it("should return undefined for root node (no parent)", () => {
    const parent = findParent(mockMembers, "club");

    expect(parent).toBeUndefined();
  });

  it("should return undefined for non-existent member", () => {
    const parent = findParent(mockMembers, "non-existent");

    expect(parent).toBeUndefined();
  });

  it("should return undefined for null memberId", () => {
    const parent = findParent(mockMembers, null);

    expect(parent).toBeUndefined();
  });

  it("should return undefined for undefined memberId", () => {
    const parent = findParent(mockMembers, undefined);

    expect(parent).toBeUndefined();
  });

  it("should find grandparent correctly", () => {
    const parent = findParent(mockMembers, "team-manager");

    expect(parent).toBeDefined();
    expect(parent?.id).toBe("jeugdcoordinator");
  });
});

describe("getAncestors", () => {
  it("should get all ancestors of a deeply nested member", () => {
    const ancestors = getAncestors(mockMembers, "team-manager");

    expect(ancestors).toHaveLength(3);
    expect(ancestors[0].id).toBe("jeugdcoordinator");
    expect(ancestors[1].id).toBe("president");
    expect(ancestors[2].id).toBe("club");
  });

  it("should get ancestors of a direct child", () => {
    const ancestors = getAncestors(mockMembers, "president");

    expect(ancestors).toHaveLength(1);
    expect(ancestors[0].id).toBe("club");
  });

  it("should return empty array for root node", () => {
    const ancestors = getAncestors(mockMembers, "club");

    expect(ancestors).toHaveLength(0);
  });

  it("should return empty array for non-existent member", () => {
    const ancestors = getAncestors(mockMembers, "non-existent");

    expect(ancestors).toHaveLength(0);
  });

  it("should return empty array for null memberId", () => {
    const ancestors = getAncestors(mockMembers, null);

    expect(ancestors).toHaveLength(0);
  });

  it("should return empty array for undefined memberId", () => {
    const ancestors = getAncestors(mockMembers, undefined);

    expect(ancestors).toHaveLength(0);
  });

  it("should get all three levels for deeply nested member", () => {
    const ancestors = getAncestors(mockMembers, "secretary");

    expect(ancestors).toHaveLength(2);
    expect(ancestors[0].id).toBe("president");
    expect(ancestors[1].id).toBe("club");
  });

  it("should detect and break on cycles in parent chain", () => {
    // Create members with a cycle: A -> B -> C -> A
    const membersWithCycle: OrgChartNode[] = [
      {
        id: "a",
        name: "Member A",
        title: "Title A",
        parentId: "c", // Points to C, creating a cycle
      },
      {
        id: "b",
        name: "Member B",
        title: "Title B",
        parentId: "a",
      },
      {
        id: "c",
        name: "Member C",
        title: "Title C",
        parentId: "b",
      },
    ];

    const ancestors = getAncestors(membersWithCycle, "a");

    // Should detect cycle and stop, not infinite loop
    expect(ancestors.length).toBeGreaterThan(0);
    expect(ancestors.length).toBeLessThanOrEqual(3);
    // Should contain C and B but stop before repeating A
    expect(ancestors.some((m) => m.id === "c")).toBe(true);
    expect(ancestors.some((m) => m.id === "b")).toBe(true);
  });
});

describe("buildOrganigramUrl", () => {
  it("should build URL with both member and view params", () => {
    const url = buildOrganigramUrl("/club/organigram", {
      memberId: "president",
      view: "chart",
    });

    expect(url).toBe("/club/organigram?member=president&view=chart");
  });

  it("should build URL with only member param", () => {
    const url = buildOrganigramUrl("/club/organigram", {
      memberId: "secretary",
    });

    expect(url).toBe("/club/organigram?member=secretary");
  });

  it("should build URL with only view param", () => {
    const url = buildOrganigramUrl("/club/organigram", {
      view: "cards",
    });

    expect(url).toBe("/club/organigram?view=cards");
  });

  it("should return base path with no params", () => {
    const url = buildOrganigramUrl("/club/organigram", {});

    expect(url).toBe("/club/organigram");
  });

  it("should return base path when options is undefined", () => {
    const url = buildOrganigramUrl("/club/organigram");

    expect(url).toBe("/club/organigram");
  });

  it("should ignore null values", () => {
    const url = buildOrganigramUrl("/club/organigram", {
      memberId: null,
      view: null,
    });

    expect(url).toBe("/club/organigram");
  });

  it("should handle undefined values", () => {
    const url = buildOrganigramUrl("/club/organigram", {
      memberId: undefined,
      view: undefined,
    });

    expect(url).toBe("/club/organigram");
  });

  it("should properly encode special characters in member ID", () => {
    const url = buildOrganigramUrl("/club/organigram", {
      memberId: "member with spaces",
    });

    expect(url).toBe("/club/organigram?member=member+with+spaces");
  });
});

describe("parseOrganigramParams", () => {
  it("should parse URLSearchParams with both params", () => {
    const params = new URLSearchParams("?member=president&view=chart");
    const result = parseOrganigramParams(params);

    expect(result.memberId).toBe("president");
    expect(result.view).toBe("chart");
  });

  it("should parse string with both params", () => {
    const result = parseOrganigramParams("?member=secretary&view=cards");

    expect(result.memberId).toBe("secretary");
    expect(result.view).toBe("cards");
  });

  it("should parse with only member param", () => {
    const result = parseOrganigramParams("?member=treasurer");

    expect(result.memberId).toBe("treasurer");
    expect(result.view).toBeNull();
  });

  it("should parse with only view param", () => {
    const result = parseOrganigramParams("?view=responsibilities");

    expect(result.memberId).toBeNull();
    expect(result.view).toBe("responsibilities");
  });

  it("should return null values for empty string", () => {
    const result = parseOrganigramParams("");

    expect(result.memberId).toBeNull();
    expect(result.view).toBeNull();
  });

  it("should return null values for empty URLSearchParams", () => {
    const params = new URLSearchParams();
    const result = parseOrganigramParams(params);

    expect(result.memberId).toBeNull();
    expect(result.view).toBeNull();
  });

  it("should handle URL-encoded characters", () => {
    const result = parseOrganigramParams("?member=member+with+spaces");

    expect(result.memberId).toBe("member with spaces");
  });

  it("should ignore other query parameters", () => {
    const result = parseOrganigramParams(
      "?member=president&view=chart&other=value",
    );

    expect(result.memberId).toBe("president");
    expect(result.view).toBe("chart");
  });
});

import { describe, it, expect } from "vitest";
import {
  findMemberResponsibilities,
  findMemberStepResponsibilities,
  getMembersWithResponsibilities,
  getCategoryInfo,
  buildResponsibilityUrl,
} from "./responsibility-utils";
import type { ResponsibilityPath } from "@/types/responsibility";

describe("responsibility-utils", () => {
  const mockPaths: ResponsibilityPath[] = [
    {
      id: "path-1",
      role: ["speler"],
      question: "test question 1",
      keywords: ["test"],
      summary: "Test summary 1",
      category: "sportief",
      primaryContact: {
        contactType: "position",
        position: "Test Positie",
        members: [{ id: "member-1", name: "Jan Test" }],
        nodeId: "organigramNode-test",
      },
      steps: [],
    },
    {
      id: "path-2",
      role: ["ouder"],
      question: "test question 2",
      keywords: ["test"],
      summary: "Test summary 2",
      category: "medisch",
      primaryContact: {
        contactType: "position",
        position: "Andere Positie",
        members: [{ id: "member-2", name: "Piet Test" }],
        nodeId: "organigramNode-other",
      },
      steps: [
        {
          order: 1,
          description: "Step 1",
          contact: {
            contactType: "position",
            position: "Secondary Positie",
            members: [{ id: "member-1", name: "Jan Test" }],
            nodeId: "organigramNode-secondary",
          },
        },
      ],
    },
    {
      id: "path-3",
      role: ["trainer"],
      question: "test question 3",
      keywords: ["test"],
      summary: "Test summary 3",
      category: "administratief",
      primaryContact: {
        contactType: "manual",
        role: "Test Role",
      },
      steps: [],
    },
  ];

  describe("findMemberResponsibilities", () => {
    it("should find all paths where member is primary contact", () => {
      const result = findMemberResponsibilities("member-1", mockPaths);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("path-1");
    });

    it("should return empty array when member has no primary responsibilities", () => {
      const result = findMemberResponsibilities("member-3", mockPaths);
      expect(result).toHaveLength(0);
    });

    it("should return empty array for empty paths", () => {
      const result = findMemberResponsibilities("member-1", []);
      expect(result).toHaveLength(0);
    });
  });

  describe("findMemberStepResponsibilities", () => {
    it("should find paths where member is in step contacts", () => {
      const result = findMemberStepResponsibilities("member-1", mockPaths);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("path-2");
    });

    it("should return empty array when member has no step responsibilities", () => {
      const result = findMemberStepResponsibilities("member-2", mockPaths);
      expect(result).toHaveLength(0);
    });

    it("should handle paths with no steps", () => {
      const result = findMemberStepResponsibilities("member-1", [mockPaths[0]]);
      expect(result).toHaveLength(0);
    });
  });

  describe("getMembersWithResponsibilities", () => {
    it("should return all unique member IDs with responsibilities", () => {
      const result = getMembersWithResponsibilities(mockPaths);
      expect(result).toHaveLength(2);
      expect(result).toContain("member-1");
      expect(result).toContain("member-2");
    });

    it("should return empty array when no responsibilities", () => {
      const result = getMembersWithResponsibilities([]);
      expect(result).toHaveLength(0);
    });

    it("should handle paths with no member IDs (manual contacts)", () => {
      const result = getMembersWithResponsibilities([mockPaths[2]]);
      expect(result).toHaveLength(0);
    });
  });

  describe("getCategoryInfo", () => {
    it("should return correct info for medisch category", () => {
      const result = getCategoryInfo("medisch");
      expect(result.label).toBe("Medisch");
      expect(result.colorClass).toBe("text-red-600");
      expect(result.bgClass).toContain("red");
    });

    it("should return correct info for sportief category", () => {
      const result = getCategoryInfo("sportief");
      expect(result.label).toBe("Sportief");
      expect(result.colorClass).toBe("text-green-600");
      expect(result.bgClass).toContain("green");
    });

    it("should return correct info for administratief category", () => {
      const result = getCategoryInfo("administratief");
      expect(result.label).toBe("Administratief");
      expect(result.colorClass).toBe("text-purple-600");
      expect(result.bgClass).toContain("purple");
    });

    it("should return correct info for gedrag category", () => {
      const result = getCategoryInfo("gedrag");
      expect(result.label).toBe("Gedrag");
      expect(result.colorClass).toBe("text-orange-600");
      expect(result.bgClass).toContain("orange");
    });

    it("should return correct info for algemeen category", () => {
      const result = getCategoryInfo("algemeen");
      expect(result.label).toBe("Algemeen");
      expect(result.colorClass).toBe("text-blue-600");
      expect(result.bgClass).toContain("blue");
    });

    it("should return correct info for commercieel category", () => {
      const result = getCategoryInfo("commercieel");
      expect(result.label).toBe("Commercieel");
      expect(result.colorClass).toBe("text-teal-600");
      expect(result.bgClass).toContain("teal");
    });
  });

  describe("buildResponsibilityUrl", () => {
    it("should build URL without parameters", () => {
      const result = buildResponsibilityUrl("/club/organigram");
      expect(result).toBe("/club/organigram");
    });

    it("should build URL with view parameter", () => {
      const result = buildResponsibilityUrl("/club/organigram", {
        view: "responsibilities",
      });
      expect(result).toBe("/club/organigram?view=responsibilities");
    });

    it("should build URL with responsibility parameter", () => {
      const result = buildResponsibilityUrl("/club/organigram", {
        responsibilityId: "path-1",
      });
      expect(result).toBe("/club/organigram?responsibility=path-1");
    });

    it("should build URL with multiple parameters", () => {
      const result = buildResponsibilityUrl("/club/organigram", {
        view: "responsibilities",
        responsibilityId: "path-1",
      });
      expect(result).toContain("view=responsibilities");
      expect(result).toContain("responsibility=path-1");
    });
  });
});

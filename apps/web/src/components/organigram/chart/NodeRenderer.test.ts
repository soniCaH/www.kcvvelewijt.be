import { describe, it, expect } from "vitest";
import type { NodeData } from "./NodeRenderer";
import { renderNode, renderCompactNode } from "./NodeRenderer";

// --- Fixtures ---

const singleMemberNode: NodeData = {
  id: "president",
  title: "Voorzitter",
  roleCode: "PRES",
  members: [
    {
      id: "staff-1",
      name: "Jan Voorzitter",
      imageUrl: "https://example.com/jan.jpg",
    },
  ],
};

const vacantNode: NodeData = {
  id: "vacant-role",
  title: "Penningmeester",
  roleCode: "PM",
  description: "Financieel beheer van de club.",
  members: [],
};

const sharedNode: NodeData = {
  id: "shared-role",
  title: "Co-Penningmeester",
  roleCode: "PM",
  members: [
    {
      id: "staff-a",
      name: "Els Eerste",
      imageUrl: "https://example.com/els.jpg",
    },
    {
      id: "staff-b",
      name: "Tom Tweede",
      imageUrl: "https://example.com/tom.jpg",
    },
  ],
};

const threeSharedNode: NodeData = {
  id: "triple-role",
  title: "Afgevaardigde",
  members: [
    { id: "staff-x", name: "Alice" },
    { id: "staff-y", name: "Bob" },
    { id: "staff-z", name: "Carol" },
  ],
};

// --- renderNode ---

describe("renderNode", () => {
  describe("single member (members.length === 1)", () => {
    it("shows the member name and position title", () => {
      const html = renderNode(singleMemberNode, false);
      expect(html).toContain("Jan Voorzitter");
      expect(html).toContain("Voorzitter");
    });

    it("shows the member photo", () => {
      const html = renderNode(singleMemberNode, false);
      expect(html).toContain("https://example.com/jan.jpg");
    });

    it("shows the role code badge", () => {
      const html = renderNode(singleMemberNode, false);
      expect(html).toContain("PRES");
    });
  });

  describe("vacant (members.length === 0)", () => {
    it("shows the position title as primary text", () => {
      const html = renderNode(vacantNode, false);
      expect(html).toContain("Penningmeester");
    });

    it("does not show a profile photo", () => {
      const html = renderNode(vacantNode, false);
      // Should not contain an <img> tag
      expect(html).not.toMatch(/<img\s/);
    });

    it("is visually distinct with a vacant indicator", () => {
      const html = renderNode(vacantNode, false);
      expect(html).toContain("Vacante functie");
    });

    it("shows the muted description when available", () => {
      const html = renderNode(vacantNode, false);
      expect(html).toContain("Financieel beheer van de club.");
    });
  });

  describe("shared (members.length >= 2)", () => {
    it("shows the position title as header", () => {
      const html = renderNode(sharedNode, false);
      expect(html).toContain("Co-Penningmeester");
    });

    it("shows stacked photo/name chips for each member", () => {
      const html = renderNode(sharedNode, false);
      expect(html).toContain("Els Eerste");
      expect(html).toContain("Tom Tweede");
      expect(html).toContain("https://example.com/els.jpg");
      expect(html).toContain("https://example.com/tom.jpg");
    });

    it("handles 3+ members", () => {
      const html = renderNode(threeSharedNode, false);
      expect(html).toContain("Alice");
      expect(html).toContain("Bob");
      expect(html).toContain("Carol");
    });
  });
});

// --- renderCompactNode ---

describe("renderCompactNode", () => {
  describe("single member", () => {
    it("shows member name and title", () => {
      const html = renderCompactNode(singleMemberNode, false);
      expect(html).toContain("Jan Voorzitter");
      expect(html).toContain("Voorzitter");
    });
  });

  describe("vacant", () => {
    it("shows position title and vacant indicator, no photo", () => {
      const html = renderCompactNode(vacantNode, false);
      expect(html).toContain("Penningmeester");
      expect(html).toContain("Vacante functie");
      expect(html).not.toMatch(/<img\s/);
    });
  });

  describe("shared", () => {
    it("shows all member names", () => {
      const html = renderCompactNode(sharedNode, false);
      expect(html).toContain("Els Eerste");
      expect(html).toContain("Tom Tweede");
    });
  });
});

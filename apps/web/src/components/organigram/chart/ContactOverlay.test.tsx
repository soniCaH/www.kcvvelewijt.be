import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactOverlay } from "./ContactOverlay";
import type { OrgChartNode } from "@/types/organigram";

const singleNode: OrgChartNode = {
  id: "president",
  title: "Voorzitter",
  roleCode: "PRES",
  members: [
    {
      id: "staff-1",
      name: "Jan Voorzitter",
      email: "jan@kcvv.be",
      phone: "+32 470 123456",
      href: "/staf/123",
    },
  ],
};

const vacantNode: OrgChartNode = {
  id: "vacant",
  title: "Penningmeester",
  description: "Financieel beheer van de club.",
  members: [],
};

const sharedNode: OrgChartNode = {
  id: "shared",
  title: "Co-Penningmeester",
  members: [
    {
      id: "staff-a",
      name: "Els Eerste",
      email: "els@kcvv.be",
      href: "/staf/a",
    },
    {
      id: "staff-b",
      name: "Tom Tweede",
      phone: "+32 470 999999",
      href: "/staf/b",
    },
  ],
};

const defaultProps = {
  isVisible: true,
  position: { x: 100, y: 100 },
  onClose: vi.fn(),
  onViewDetails: vi.fn(),
};

describe("ContactOverlay", () => {
  describe("single member", () => {
    it("shows member name and position title", () => {
      render(<ContactOverlay member={singleNode} {...defaultProps} />);
      expect(screen.getByText("Jan Voorzitter")).toBeInTheDocument();
      expect(screen.getByText("Voorzitter")).toBeInTheDocument();
    });
  });

  describe("vacant node", () => {
    it("shows position title and description only", () => {
      render(<ContactOverlay member={vacantNode} {...defaultProps} />);
      expect(screen.getByText("Penningmeester")).toBeInTheDocument();
      expect(
        screen.getByText("Financieel beheer van de club."),
      ).toBeInTheDocument();
    });

    it("shows vacant indicator", () => {
      render(<ContactOverlay member={vacantNode} {...defaultProps} />);
      expect(screen.getByText("Vacante functie")).toBeInTheDocument();
    });
  });

  describe("shared node", () => {
    it("shows position title prominently", () => {
      render(<ContactOverlay member={sharedNode} {...defaultProps} />);
      expect(screen.getByText("Co-Penningmeester")).toBeInTheDocument();
    });

    it("shows one contact block per member", () => {
      render(<ContactOverlay member={sharedNode} {...defaultProps} />);
      expect(screen.getByText("Els Eerste")).toBeInTheDocument();
      expect(screen.getByText("Tom Tweede")).toBeInTheDocument();
    });

    it("shows profile links for each member", () => {
      render(<ContactOverlay member={sharedNode} {...defaultProps} />);
      const links = screen.getAllByText("Profiel bekijken");
      expect(links).toHaveLength(2);
    });
  });
});

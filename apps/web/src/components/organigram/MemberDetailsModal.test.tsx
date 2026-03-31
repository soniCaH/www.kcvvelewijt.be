import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemberDetailsModal } from "./MemberDetailsModal";
import type { OrgChartNode } from "@/types/organigram";

const singleNode: OrgChartNode = {
  id: "president",
  title: "Voorzitter",
  roleCode: "PRES",
  department: "hoofdbestuur",
  description: "Leiding geven aan het bestuur.",
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
  roleCode: "PM",
  description: "Financieel beheer.",
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
  isOpen: true,
  onClose: vi.fn(),
};

describe("MemberDetailsModal", () => {
  describe("single member", () => {
    it("shows member name and position title", () => {
      render(<MemberDetailsModal member={singleNode} {...defaultProps} />);
      expect(screen.getByText("Jan Voorzitter")).toBeInTheDocument();
      expect(screen.getByText("Voorzitter")).toBeInTheDocument();
    });

    it("shows contact info", () => {
      render(<MemberDetailsModal member={singleNode} {...defaultProps} />);
      expect(screen.getByText("jan@kcvv.be")).toBeInTheDocument();
      expect(screen.getByText("+32 470 123456")).toBeInTheDocument();
    });
  });

  describe("vacant node", () => {
    it("shows position title prominently", () => {
      render(<MemberDetailsModal member={vacantNode} {...defaultProps} />);
      expect(screen.getByText("Penningmeester")).toBeInTheDocument();
    });

    it("shows description", () => {
      render(<MemberDetailsModal member={vacantNode} {...defaultProps} />);
      expect(
        screen.getByText("Financieel beheer van de club."),
      ).toBeInTheDocument();
    });

    it("shows vacant indicator", () => {
      render(<MemberDetailsModal member={vacantNode} {...defaultProps} />);
      expect(screen.getByText("Vacante functie")).toBeInTheDocument();
    });

    it("does not show contact section", () => {
      render(<MemberDetailsModal member={vacantNode} {...defaultProps} />);
      expect(screen.queryByText("Contactgegevens")).not.toBeInTheDocument();
    });
  });

  describe("shared node", () => {
    it("shows position title as header", () => {
      render(<MemberDetailsModal member={sharedNode} {...defaultProps} />);
      expect(screen.getByText("Co-Penningmeester")).toBeInTheDocument();
    });

    it("shows one contact block per member", () => {
      render(<MemberDetailsModal member={sharedNode} {...defaultProps} />);
      expect(screen.getByText("Els Eerste")).toBeInTheDocument();
      expect(screen.getByText("Tom Tweede")).toBeInTheDocument();
    });

    it("shows profile links for members with href", () => {
      render(<MemberDetailsModal member={sharedNode} {...defaultProps} />);
      const links = screen.getAllByText("Bekijk volledig profiel");
      expect(links).toHaveLength(2);
    });
  });
});

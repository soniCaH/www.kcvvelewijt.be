/**
 * ScheurkalenderPage Component Tests
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ScheurkalenderPage,
  type ScheurkalenderDay,
} from "./ScheurkalenderPage";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockDays: ScheurkalenderDay[] = [
  {
    key: "2026-03-15",
    label: "zondag 15 maart 2026",
    matches: [
      {
        id: 1,
        time: "15:00",
        squadLabel: "A-Ploeg",
        homeTeam: { name: "KCVV Elewijt", logo: "/kcvv.png" },
        awayTeam: { name: "Strombeek" },
      },
      {
        id: 2,
        time: "11:00",
        squadLabel: "U15A",
        homeTeam: { name: "KCVV Elewijt U15" },
        awayTeam: { name: "FC Kampenhout U15" },
      },
    ],
  },
  {
    key: "2026-03-22",
    label: "zondag 22 maart 2026",
    matches: [
      {
        id: 3,
        homeTeam: { name: "Racing Mechelen" },
        awayTeam: { name: "KCVV Elewijt" },
      },
    ],
  },
];

describe("ScheurkalenderPage", () => {
  describe("empty state", () => {
    it("renders empty state message when no days", () => {
      render(<ScheurkalenderPage days={[]} />);
      expect(
        screen.getByText("Geen aankomende wedstrijden gevonden."),
      ).toBeInTheDocument();
    });

    it("does not render day sections when no days", () => {
      render(<ScheurkalenderPage days={[]} />);
      expect(
        screen.queryByText("zondag 15 maart 2026"),
      ).not.toBeInTheDocument();
    });
  });

  describe("day sections", () => {
    it("renders a section for each day", () => {
      render(<ScheurkalenderPage days={mockDays} />);
      expect(screen.getByText("zondag 15 maart 2026")).toBeInTheDocument();
      expect(screen.getByText("zondag 22 maart 2026")).toBeInTheDocument();
    });

    it("renders all matches across all days", () => {
      render(<ScheurkalenderPage days={mockDays} />);
      expect(screen.getAllByText("KCVV Elewijt").length).toBeGreaterThanOrEqual(
        1,
      );
      expect(screen.getByText("Strombeek")).toBeInTheDocument();
      expect(screen.getByText("FC Kampenhout U15")).toBeInTheDocument();
      expect(screen.getByText("Racing Mechelen")).toBeInTheDocument();
    });
  });

  describe("match rows", () => {
    it("renders match time when provided", () => {
      render(<ScheurkalenderPage days={[mockDays[0]]} />);
      expect(screen.getByText("15:00")).toBeInTheDocument();
      expect(screen.getByText("11:00")).toBeInTheDocument();
    });

    it("renders em-dash when no time provided", () => {
      render(<ScheurkalenderPage days={[mockDays[1]]} />);
      expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("renders squad label badge when squadLabel is provided", () => {
      render(<ScheurkalenderPage days={[mockDays[0]]} />);
      expect(screen.getByText("A-Ploeg")).toBeInTheDocument();
      expect(screen.getByText("U15A")).toBeInTheDocument();
    });

    it("does not render squad label badge when squadLabel is absent", () => {
      render(<ScheurkalenderPage days={[mockDays[1]]} />);
      expect(screen.queryByText("A-Ploeg")).not.toBeInTheDocument();
    });

    it("renders home team logo when provided", () => {
      const { container } = render(<ScheurkalenderPage days={[mockDays[0]]} />);
      // First match has a home logo (alt="" → role="presentation")
      const images = container.querySelectorAll("img");
      expect(images.length).toBeGreaterThanOrEqual(1);
      expect(images[0]).toHaveAttribute("src", "/kcvv.png");
    });

    it("does not render away team logo when absent", () => {
      const { container } = render(<ScheurkalenderPage days={[mockDays[0]]} />);
      // Only the home logo of match 1 is present; away has no logo
      const images = container.querySelectorAll("img");
      expect(images).toHaveLength(1);
    });
  });

  describe("chrome elements", () => {
    it("renders the print button", () => {
      render(<ScheurkalenderPage days={mockDays} />);
      expect(
        screen.getByRole("button", { name: "Afdrukken" }),
      ).toBeInTheDocument();
    });

    it("renders the back link to /kalender", () => {
      render(<ScheurkalenderPage days={mockDays} />);
      expect(
        screen.getByRole("link", { name: /terug naar kalender/i }),
      ).toHaveAttribute("href", "/kalender");
    });
  });
});

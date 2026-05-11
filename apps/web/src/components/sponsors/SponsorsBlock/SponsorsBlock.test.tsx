import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { vi } from "vitest";
import { SponsorsBlock } from "./SponsorsBlock";
import {
  mockHoofdsponsors,
  mockSponsorsMissingLogos,
  mockSponsorsMixed,
  mockSponsorsTier,
} from "./SponsorsBlock.mocks";
import type { Sponsor } from "../Sponsors";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...rest }: ImageProps) => {
    const props = { alt, src: typeof src === "string" ? src : "", ...rest };
    return <img {...props} />;
  },
}));

describe("SponsorsBlock", () => {
  it("returns null when sponsors list is empty", () => {
    const { container } = render(<SponsorsBlock sponsors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("filters out sympathisant rows and renders only hoofdsponsor + sponsor", () => {
    const sympathisant: Sponsor = {
      id: "x-1",
      name: "Out Of Tier",
      logo: "https://example.com/out.png",
      tier: "sympathisant",
    };
    render(
      <SponsorsBlock
        sponsors={[...mockHoofdsponsors, sympathisant, ...mockSponsorsTier]}
      />,
    );
    expect(screen.queryByText("Out Of Tier")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(
      mockHoofdsponsors.length + mockSponsorsTier.length,
    );
  });

  it("renders hoofdsponsors before sponsors", () => {
    render(<SponsorsBlock sponsors={mockSponsorsMixed} />);
    const items = screen.getAllByRole("listitem");
    const firstTierLabels = items
      .slice(0, mockHoofdsponsors.length)
      .flatMap((li) =>
        Array.from(li.querySelectorAll("a"))
          .map((a) => a.getAttribute("aria-label") ?? "")
          .filter(Boolean),
      );
    mockHoofdsponsors.forEach((s) => {
      expect(firstTierLabels.some((t) => t.includes(s.name))).toBe(true);
    });
  });

  it("renders the /sponsors link", () => {
    render(<SponsorsBlock sponsors={mockHoofdsponsors} />);
    const link = screen.getByRole("link", {
      name: /alle sponsors & sympathisanten/i,
    });
    expect(link).toHaveAttribute("href", "/sponsors");
  });

  it("each tile with a url renders an external link with rel=noopener", () => {
    render(<SponsorsBlock sponsors={mockHoofdsponsors} />);
    mockHoofdsponsors.forEach((s) => {
      const link = screen.getByRole("link", {
        name: new RegExp(`Bezoek de website van ${s.name}`),
      });
      expect(link).toHaveAttribute("href", s.url!);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("renders italic wordmark fallback when a sponsor has no logo", () => {
    render(<SponsorsBlock sponsors={mockSponsorsMissingLogos} />);
    const missing = mockSponsorsMissingLogos.filter((s) => !s.logo);
    missing.forEach((s) => {
      expect(screen.getByText(s.name)).toBeInTheDocument();
    });
  });

  it("sorts hoofdsponsors alphabetically within their tier", () => {
    const shuffled = [
      mockHoofdsponsors[2]!,
      mockHoofdsponsors[0]!,
      mockHoofdsponsors[1]!,
    ];
    render(<SponsorsBlock sponsors={shuffled} />);
    const items = screen.getAllByRole("listitem");
    const labels = items.map(
      (li) => li.querySelector("a")?.getAttribute("aria-label") ?? "",
    );
    expect(labels[0]).toContain("Bakkerij Peeters");
    expect(labels[1]).toContain("Garage Vermeulen");
    expect(labels[2]).toContain("Tuinaanleg De Smet");
  });
});

/**
 * SearchRelated Component Tests
 */

import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchRelated } from "./SearchRelated";
import type { SemanticRelatedItem } from "./useSemanticAugment";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const ITEMS: SemanticRelatedItem[] = [
  {
    type: "article",
    title: "Jeugddag groot succes",
    excerpt: "Sfeerverslag van de open trainingen.",
    href: "/nieuws/jeugddag",
  },
  {
    type: "page",
    title: "Onze jeugdvisie",
    excerpt: "Hoe we ploegen samenstellen.",
    href: "/club/jeugdvisie",
  },
];

describe("SearchRelated", () => {
  it("renders the 'Gerelateerd' heading", () => {
    render(<SearchRelated items={ITEMS} />);
    expect(screen.getByText("Gerelateerd")).toBeInTheDocument();
  });

  it("renders each item as a focusable link to its derived URL", () => {
    render(<SearchRelated items={ITEMS} />);

    expect(
      screen.getByRole("link", { name: /jeugddag groot succes/i }),
    ).toHaveAttribute("href", "/nieuws/jeugddag");
    expect(
      screen.getByRole("link", { name: /onze jeugdvisie/i }),
    ).toHaveAttribute("href", "/club/jeugdvisie");
  });

  it("shows the type label per item", () => {
    render(<SearchRelated items={ITEMS} />);
    expect(screen.getByText("Nieuws")).toBeInTheDocument();
    expect(screen.getByText("Pagina")).toBeInTheDocument();
  });
});

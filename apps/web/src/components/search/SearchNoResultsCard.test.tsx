/**
 * SearchNoResultsCard Component Tests
 */

import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchNoResultsCard } from "./SearchNoResultsCard";

// Mock Next.js Link (Vitest hoisting requirement keeps this in-file).
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("SearchNoResultsCard", () => {
  it("renders the football-pun headline", () => {
    render(<SearchNoResultsCard query="elewijt" />);

    // The trailing "." is an emphasis span, so the heading's own text node is
    // "Geen treffers".
    expect(screen.getByText("Geen treffers")).toBeInTheDocument();
  });

  it("names the missing query in the body", () => {
    render(<SearchNoResultsCard query="zzqxptw" />);

    expect(screen.getByText(/niets gevonden voor/i)).toBeInTheDocument();
    expect(screen.getByText("zzqxptw")).toBeInTheDocument();
  });

  it("offers three inline way-forward links to section indexes", () => {
    render(<SearchNoResultsCard query="elewijt" />);

    expect(screen.getByRole("link", { name: "nieuws" })).toHaveAttribute(
      "href",
      "/nieuws",
    );
    // Players have no dedicated index — both ploegen and spelers resolve to
    // /ploegen (owner decision, #2106).
    expect(screen.getByRole("link", { name: "ploegen" })).toHaveAttribute(
      "href",
      "/ploegen",
    );
    expect(screen.getByRole("link", { name: "spelers" })).toHaveAttribute(
      "href",
      "/ploegen",
    );
  });

  it("renders the taped jersey artefact", () => {
    render(<SearchNoResultsCard query="elewijt" />);

    // <JerseyShirt> renders a labelled <figure>.
    expect(screen.getByLabelText("KCVV jersey")).toBeInTheDocument();
  });
});

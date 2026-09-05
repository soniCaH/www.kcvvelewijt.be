/**
 * SearchNoResultsCard Component Tests
 */

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchNoResultsCard } from "./SearchNoResultsCard";

// Mock Next.js Link (Vitest hoisting requirement keeps this in-file).
// className must be forwarded — the .prose-link marker assertion below
// reads it off the rendered anchor.
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
  } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
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

  // #2474 rule 2 — these three links sit inside a running sentence ("Probeer
  // een andere term — of spring meteen naar nieuws, ploegen of spelers."),
  // so they are body copy and join `.prose-link` rather than wearing the
  // affordance-chip styling they had before.
  it("renders the way-forward links with the .prose-link marker", () => {
    render(<SearchNoResultsCard query="elewijt" />);

    expect(screen.getByRole("link", { name: "nieuws" })).toHaveClass(
      "prose-link",
    );
  });

  it("renders the taped jersey artefact", () => {
    render(<SearchNoResultsCard query="elewijt" />);

    // <JerseyShirt> renders a labelled <figure>.
    // The jersey artefact is silent (#2559 rule 4) — assert the drawing,
    // not a label it no longer carries.
    expect(document.querySelector("figure[aria-hidden]")).toBeInTheDocument();
  });
});

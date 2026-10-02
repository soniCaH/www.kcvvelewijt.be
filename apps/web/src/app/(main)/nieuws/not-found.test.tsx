import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound, { metadata } from "./not-found";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

/**
 * Segment 404 for a dead article slug (#2522). Lives at `(main)/nieuws/`, the
 * parent of `[slug]`, because the #2968 existence check fires `notFound()` in
 * `[slug]/layout.tsx` and a `not-found.tsx` never catches its own segment's
 * layout.
 */
describe("nieuws NotFound page", () => {
  it("carries robots noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("names the article in the body copy", () => {
    render(<NotFound />);
    expect(
      screen.getByText(/dit artikel staat niet \(meer\) op het veld/i),
    ).toBeInTheDocument();
  });

  it("leads with a primary link back to the news archive", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: "Naar het nieuws" });
    expect(link).toHaveAttribute("href", "/nieuws");
    expect(link).toHaveAttribute("data-error-action", "news");
  });

  it("offers search second, with no homepage action", () => {
    render(<NotFound />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/nieuws",
      "/zoeken",
    ]);
    expect(links[1]).toHaveAttribute("data-error-action", "search");
  });
});

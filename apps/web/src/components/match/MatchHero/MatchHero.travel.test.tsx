import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MatchHero } from "./MatchHero";

// The stock `react` build used by Vitest renders `<ViewTransition>` as a bare
// passthrough, so the boundary is invisible in the DOM. Stand it in with a
// marked wrapper to see which hero carries it and under which name.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  ViewTransition: ({
    name,
    share,
    default: all,
    children,
  }: {
    name?: string;
    share?: string;
    default?: string;
    children: ReactNode;
  }) => (
    <div data-view-transition={name} data-share={share} data-default={all}>
      {children}
    </div>
  ),
}));

const homeTeam = { id: 1235, name: "KCVV Elewijt" };
const awayTeam = { id: 9999, name: "RC Mechelen" };
const date = new Date("2025-06-14T13:30:00Z");

describe("MatchHero travel target (#3397)", () => {
  it("names the full hero's card so a tapped fixture row can grow into it", () => {
    const { container } = render(
      <MatchHero
        match={{
          kind: "match",
          id: 3740,
          homeTeam,
          awayTeam,
          date,
          time: "14:30",
          status: "scheduled",
        }}
      />,
    );
    const target = container.querySelector(
      '[data-view-transition="match-travel-3740"]',
    );
    expect(target).not.toBeNull();
    // Opts in on `share` only: a plain arrival or leave starts no transition.
    expect(target).toHaveAttribute("data-default", "none");
    expect(target).toHaveAttribute("data-share", "travel");
    expect(target?.querySelector("section")).not.toBeNull();
  });

  it("takes no name without a match id — nothing to pair with", () => {
    const { container } = render(
      <MatchHero
        match={{
          kind: "match",
          homeTeam,
          awayTeam,
          date,
          status: "scheduled",
        }}
      />,
    );
    expect(container.querySelector("[data-view-transition]")).toBeNull();
  });

  it("does not name the reservation stub hero — it has no row to meet", () => {
    const { container } = render(
      <MatchHero
        match={{
          kind: "reservation",
          team: homeTeam,
          date,
          time: "09:30",
          status: "scheduled",
        }}
      />,
    );
    expect(container.querySelector("[data-view-transition]")).toBeNull();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MatchTravelLink } from "./MatchTravelLink";

vi.mock("next/navigation", () => ({ usePathname: () => "/kalender" }));

describe("MatchTravelLink", () => {
  it("links to the match page from its id", () => {
    render(
      <MatchTravelLink matchId={42} aria-label="rij">
        rij
      </MatchTravelLink>,
    );
    expect(screen.getByRole("link", { name: "rij" })).toHaveAttribute(
      "href",
      "/wedstrijd/42",
    );
  });

  it("puts no view-transition-name on the link at render", () => {
    render(
      <MatchTravelLink matchId={7} aria-label="rij">
        rij
      </MatchTravelLink>,
    );
    expect(screen.getByRole("link", { name: "rij" })).not.toHaveAttribute(
      "style",
    );
  });

  it("still calls the row's own onClick", () => {
    const onClick = vi.fn();
    render(
      <MatchTravelLink matchId={7} onClick={onClick} aria-label="rij">
        rij
      </MatchTravelLink>,
    );
    fireEvent.click(screen.getByRole("link", { name: "rij" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

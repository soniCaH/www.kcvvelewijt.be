import { beforeEach, describe, it, expect, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MatchTravelLink } from "./MatchTravelLink";

vi.mock("next/navigation", () => ({ usePathname: () => "/kalender" }));

const tap = vi.hoisted(() => vi.fn());
const linkProps = vi.hoisted(() => vi.fn());
// Stands in for `next/link` to observe the props `<Link>` receives.
vi.mock("next/link", () => ({
  default: ({
    transitionTypes,
    ...props
  }: ComponentProps<"a"> & { transitionTypes?: string[] }) => {
    linkProps({ transitionTypes });
    return <a {...props} />;
  },
}));
vi.mock("@/hooks/useMatchTravel", () => ({
  useMatchTravel: () => ({ transition: { default: "none" }, onClick: tap }),
}));

describe("MatchTravelLink", () => {
  beforeEach(() => {
    tap.mockClear();
    linkProps.mockClear();
  });

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

  it("adds the transition type the page cut is keyed on", () => {
    render(
      <MatchTravelLink matchId={42} aria-label="rij">
        rij
      </MatchTravelLink>,
    );
    expect(linkProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ transitionTypes: ["match-travel"] }),
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

  describe("records a tap only for a click that navigates", () => {
    const row = () => screen.getByRole("link", { name: "rij" });
    const renderRow = (onClick?: (e: React.MouseEvent) => void) =>
      render(
        <MatchTravelLink matchId={42} aria-label="rij" onClick={onClick}>
          rij
        </MatchTravelLink>,
      );

    it("a plain primary click", () => {
      renderRow();
      fireEvent.click(row());
      expect(tap).toHaveBeenCalledTimes(1);
    });

    it.each([["metaKey"], ["ctrlKey"], ["shiftKey"], ["altKey"]])(
      "not a %s click",
      (modifier) => {
        renderRow();
        fireEvent.click(row(), { [modifier]: true });
        expect(tap).not.toHaveBeenCalled();
      },
    );

    it("not a non-primary button", () => {
      renderRow();
      fireEvent.click(row(), { button: 1 });
      expect(tap).not.toHaveBeenCalled();
    });

    it("not a click the consumer's onClick cancelled", () => {
      renderRow((event) => event.preventDefault());
      fireEvent.click(row());
      expect(tap).not.toHaveBeenCalled();
    });
  });
});

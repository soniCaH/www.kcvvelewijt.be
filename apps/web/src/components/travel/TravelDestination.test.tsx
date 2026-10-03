import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TravelDestination } from "./TravelDestination";

// See `Travel.test.tsx`: the stock build renders `<ViewTransition>` bare.
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

describe("TravelDestination", () => {
  it("names its child after the record, on share only", () => {
    const { container } = render(
      <TravelDestination kind="player" id="jan-peeters">
        <figure>foto</figure>
      </TravelDestination>,
    );
    const target = container.querySelector("[data-view-transition]");
    expect(target).toHaveAttribute(
      "data-view-transition",
      "player-travel-jan-peeters",
    );
    expect(target).toHaveAttribute("data-default", "none");
    expect(target).toHaveAttribute("data-share", "travel");
    expect(target?.querySelector("figure")).not.toBeNull();
  });

  it("renders its child bare without an id — nothing to pair with", () => {
    const { container } = render(
      <TravelDestination kind="player" id={undefined}>
        <figure>foto</figure>
      </TravelDestination>,
    );
    expect(container.querySelector("[data-view-transition]")).toBeNull();
    expect(container.querySelector("figure")).not.toBeNull();
  });
});

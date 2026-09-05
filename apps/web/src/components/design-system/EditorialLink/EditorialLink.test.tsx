import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialLink } from "./EditorialLink";

describe("EditorialLink", () => {
  it("renders an anchor with the given href and children", () => {
    render(<EditorialLink href="/news">Lees meer</EditorialLink>);
    const link = screen.getByRole("link", { name: /lees meer/i });
    expect(link).toHaveAttribute("href", "/news");
  });

  it("defaults to light tone", () => {
    const { container } = render(
      <EditorialLink href="/x">Bekijk alles</EditorialLink>,
    );
    expect(container.firstChild).toHaveAttribute("data-tone", "light");
  });

  it("renders the trailing arrow at rest by default (#2474 rule 3)", () => {
    render(
      <EditorialLink href="/x" tone="dark">
        Bekijk alles
      </EditorialLink>,
    );
    expect(screen.getByText("→")).toBeInTheDocument();
  });

  it("can suppress the arrow with withArrow={false}", () => {
    render(
      <EditorialLink href="/x" withArrow={false}>
        No arrow
      </EditorialLink>,
    );
    expect(screen.queryByText("→")).not.toBeInTheDocument();
  });

  it("dark tone sets data-tone='dark'", () => {
    const { container } = render(
      <EditorialLink href="/x" tone="dark">
        Dark
      </EditorialLink>,
    );
    expect(container.firstChild).toHaveAttribute("data-tone", "dark");
  });

  it("forwards className to the rendered anchor", () => {
    const { container } = render(
      <EditorialLink href="/x" className="custom-class">
        X
      </EditorialLink>,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  // #2394 — a tripwire for deleting the hit area, not a proof it works: jsdom
  // computes no layout, so only the real coarse-pointer measurement at 390px
  // can show the target is big enough. Both halves are asserted because the
  // padding without the margin would reflow every section header.
  it("carries the hit area and its layout-neutralising margin", () => {
    const { container } = render(<EditorialLink href="/x">X</EditorialLink>);
    expect(container.firstChild).toHaveClass("py-2", "-my-2");
  });

  // #2474 rule 3 — the highlighter marker is reserved for links inside a
  // running sentence (`.prose-link`); an onward CTA never carries it. The
  // marker's implementation is a `mask-image` sweep span — assert none
  // renders rather than asserting an implementation detail is absent by name.
  it("never renders a highlighter sweep", () => {
    const { container } = render(
      <EditorialLink href="/x">Bekijk alles</EditorialLink>,
    );
    expect(container.querySelector("[style*='mask-image']")).toBeNull();
  });

  // Arbitrary anchor attributes (e.g. a `data-*` selector a consumer needs)
  // pass through — the component has no dedicated prop for every possible
  // selector, so it forwards what it doesn't recognise instead of dropping
  // it (EventFactInline's linked-event line relies on this).
  it("forwards unrecognised props to the rendered anchor", () => {
    render(
      <EditorialLink href="/x" data-testid="onward-link">
        X
      </EditorialLink>,
    );
    expect(screen.getByTestId("onward-link")).toBeInTheDocument();
  });
});

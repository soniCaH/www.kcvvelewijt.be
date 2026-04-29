import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonoLabelRow } from "./MonoLabelRow";

describe("MonoLabelRow", () => {
  it("renders each item as a MonoLabel", () => {
    render(
      <MonoLabelRow
        items={[{ label: "INTERVIEW" }, { label: "JEUGD" }, { label: "U15" }]}
      />,
    );
    expect(screen.getByText("INTERVIEW")).toBeInTheDocument();
    expect(screen.getByText("JEUGD")).toBeInTheDocument();
    expect(screen.getByText("U15")).toBeInTheDocument();
  });

  it("renders the default '·' divider between adjacent items only", () => {
    const { container } = render(
      <MonoLabelRow items={[{ label: "A" }, { label: "B" }, { label: "C" }]} />,
    );
    const dividers = container.querySelectorAll('[data-divider="true"]');
    // n items → n-1 dividers
    expect(dividers).toHaveLength(2);
    dividers.forEach((d) => expect(d.textContent).toBe("·"));
  });

  it("respects a custom divider glyph", () => {
    const { container } = render(
      <MonoLabelRow divider="★" items={[{ label: "A" }, { label: "B" }]} />,
    );
    const dividers = container.querySelectorAll('[data-divider="true"]');
    expect(dividers).toHaveLength(1);
    expect(dividers[0]!.textContent).toBe("★");
  });

  it("dividers carry aria-hidden", () => {
    const { container } = render(
      <MonoLabelRow items={[{ label: "A" }, { label: "B" }]} />,
    );
    const div = container.querySelector('[data-divider="true"]');
    expect(div).toHaveAttribute("aria-hidden", "true");
  });

  it("as='ol' renders <ol> with <li> per item", () => {
    const { container } = render(
      <MonoLabelRow as="ol" items={[{ label: "A" }, { label: "B" }]} />,
    );
    expect((container.firstChild as HTMLElement).tagName).toBe("OL");
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("as='ul' renders <ul> with <li> per item", () => {
    const { container } = render(
      <MonoLabelRow as="ul" items={[{ label: "A" }]} />,
    );
    expect((container.firstChild as HTMLElement).tagName).toBe("UL");
    expect(container.querySelectorAll("li")).toHaveLength(1);
  });

  it("default as='div' uses inline <span> wrappers", () => {
    const { container } = render(
      <MonoLabelRow items={[{ label: "A" }, { label: "B" }]} />,
    );
    expect((container.firstChild as HTMLElement).tagName).toBe("DIV");
    expect(container.querySelectorAll("li")).toHaveLength(0);
  });

  it("forwards per-item variant and size to MonoLabel", () => {
    const { container } = render(
      <MonoLabelRow
        items={[{ label: "A", variant: "pill-jersey", size: "md" }]}
      />,
    );
    const label = container.querySelector('[data-variant="pill-jersey"]');
    expect(label).not.toBeNull();
    expect(label).toHaveAttribute("data-size", "md");
  });

  it("renders nothing when items is empty", () => {
    const { container } = render(<MonoLabelRow items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("merges className", () => {
    const { container } = render(
      <MonoLabelRow className="custom-row" items={[{ label: "A" }]} />,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      "custom-row",
    );
  });
});

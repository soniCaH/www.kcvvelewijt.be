import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialKicker } from "./EditorialKicker";

describe("EditorialKicker", () => {
  it("sandwiches the items with a leading and trailing ★ glyph", () => {
    render(
      <EditorialKicker items={[{ label: "INTERVIEW" }, { label: "8 MIN" }]} />,
    );
    expect(screen.getByText("INTERVIEW")).toBeInTheDocument();
    expect(screen.getByText("8 MIN")).toBeInTheDocument();
    // ★ glyphs render only at the outer wrapper positions, not as
    // dividers between items.
    const stars = screen.getAllByText("★");
    expect(stars).toHaveLength(2);
  });

  it("uses dot dividers between items (not stars)", () => {
    const { container } = render(
      <EditorialKicker items={[{ label: "A" }, { label: "B" }]} />,
    );
    // The default MonoLabelRow divider is the bullet dot, rendered as a
    // span with data-divider-glyph="·".
    expect(container.querySelector('[data-divider-glyph="·"]')).not.toBeNull();
    expect(
      container.querySelector('[data-divider-glyph="★"][data-divider="true"]'),
    ).toBeNull();
  });

  it("renders nothing when items is empty", () => {
    const { container } = render(<EditorialKicker items={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

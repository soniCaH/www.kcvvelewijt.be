import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashedDivider, DottedDivider, SolidDivider } from "./Divider";

describe("Divider variants", () => {
  it.each([
    ["dotted", DottedDivider],
    ["dashed", DashedDivider],
    ["solid", SolidDivider],
  ] as const)("%s renders with correct style", (style, Component) => {
    const { container } = render(<Component />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-style", style);
  });

  it("inset adds left padding via data attribute", () => {
    const { container } = render(<DashedDivider inset />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-inset", "true");
  });

  it("color prop changes data attribute", () => {
    const { container } = render(<SolidDivider color="paper-edge" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "paper-edge");
  });
});

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { createElement, type ComponentType } from "react";

vi.mock("@phosphor-icons/react", () => {
  const makeIcon = (name: string) =>
    vi.fn(
      (props: {
        weight?: string;
        size?: number;
        className?: string;
        [key: string]: unknown;
      }) =>
        createElement("span", {
          "data-icon": name,
          "data-weight": props.weight,
          "data-size": props.size,
          "data-classname": props.className,
        }),
    );

  return {
    ArrowRight: makeIcon("ArrowRight"),
    CaretDown: makeIcon("CaretDown"),
    CaretLeft: makeIcon("CaretLeft"),
    CaretRight: makeIcon("CaretRight"),
    CheckCircle: makeIcon("CheckCircle"),
    Heart: makeIcon("Heart"),
    List: makeIcon("List"),
    MagnifyingGlass: makeIcon("MagnifyingGlass"),
    Warning: makeIcon("Warning"),
    WarningCircle: makeIcon("WarningCircle"),
    X: makeIcon("X"),
  };
});

import {
  ArrowRight,
  CaretDown,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Heart,
  List,
  MagnifyingGlass,
  Warning,
  WarningCircle,
  X,
} from "./icons.redesign";

const wrappers: Array<
  [string, ComponentType<{ size?: number; className?: string }>]
> = [
  ["ArrowRight", ArrowRight],
  ["CaretDown", CaretDown],
  ["CaretLeft", CaretLeft],
  ["CaretRight", CaretRight],
  ["CheckCircle", CheckCircle],
  ["Heart", Heart],
  ["List", List],
  ["MagnifyingGlass", MagnifyingGlass],
  ["Warning", Warning],
  ["WarningCircle", WarningCircle],
  ["X", X],
];

describe("icons.redesign — Phosphor Fill wrapper shim", () => {
  it.each(wrappers)(
    "%s wrapper forces weight='fill' on the underlying Phosphor icon",
    (name, Wrapper) => {
      const { container } = render(<Wrapper />);
      const el = container.querySelector(`[data-icon="${name}"]`);
      expect(el).not.toBeNull();
      expect(el?.getAttribute("data-weight")).toBe("fill");
    },
  );

  it("forwards user-supplied props (size, className) through to the underlying icon", () => {
    const { container } = render(
      <ArrowRight size={32} className="custom-icon" />,
    );
    const el = container.querySelector('[data-icon="ArrowRight"]');
    expect(el).not.toBeNull();
    expect(el?.getAttribute("data-weight")).toBe("fill");
    expect(el?.getAttribute("data-size")).toBe("32");
    expect(el?.getAttribute("data-classname")).toBe("custom-icon");
  });

  it("ignores any runtime weight override passed by a consumer that bypasses the type", () => {
    // TypeScript prevents this at compile time because RedesignIconProps =
    // Omit<IconProps, "weight">. The runtime spread order (`{ ...props, weight: "fill" }`)
    // is the defence-in-depth guarantee that verifies the contract holds even when
    // a caller force-casts past the type, ensuring the visual contract cannot drift.
    const Escaped = ArrowRight as unknown as ComponentType<{ weight: string }>;
    const { container } = render(<Escaped weight="thin" />);
    const el = container.querySelector('[data-icon="ArrowRight"]');
    expect(el?.getAttribute("data-weight")).toBe("fill");
  });
});

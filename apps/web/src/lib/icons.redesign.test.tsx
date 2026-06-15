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
    ArrowsOut: makeIcon("ArrowsOut"),
    Bus: makeIcon("Bus"),
    Car: makeIcon("Car"),
    CaretDown: makeIcon("CaretDown"),
    CaretLeft: makeIcon("CaretLeft"),
    CaretRight: makeIcon("CaretRight"),
    CaretUp: makeIcon("CaretUp"),
    CheckCircle: makeIcon("CheckCircle"),
    Coffee: makeIcon("Coffee"),
    DownloadSimple: makeIcon("DownloadSimple"),
    Envelope: makeIcon("Envelope"),
    Eye: makeIcon("Eye"),
    FileText: makeIcon("FileText"),
    FirstAid: makeIcon("FirstAid"),
    Handshake: makeIcon("Handshake"),
    Heart: makeIcon("Heart"),
    House: makeIcon("House"),
    Info: makeIcon("Info"),
    List: makeIcon("List"),
    MagnifyingGlass: makeIcon("MagnifyingGlass"),
    MapPin: makeIcon("MapPin"),
    Phone: makeIcon("Phone"),
    Question: makeIcon("Question"),
    ShieldCheck: makeIcon("ShieldCheck"),
    SoccerBall: makeIcon("SoccerBall"),
    Sparkle: makeIcon("Sparkle"),
    Ticket: makeIcon("Ticket"),
    TreeStructure: makeIcon("TreeStructure"),
    User: makeIcon("User"),
    UsersThree: makeIcon("UsersThree"),
    Warning: makeIcon("Warning"),
    WarningCircle: makeIcon("WarningCircle"),
    Wheelchair: makeIcon("Wheelchair"),
    X: makeIcon("X"),
  };
});

import {
  ArrowRight,
  ArrowsOut,
  Bus,
  Car,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  CheckCircle,
  Coffee,
  DownloadSimple,
  Envelope,
  Eye,
  FileText,
  FirstAid,
  Handshake,
  Heart,
  House,
  Info,
  List,
  MagnifyingGlass,
  MapPin,
  Phone,
  Question,
  ShieldCheck,
  SoccerBall,
  Sparkle,
  Ticket,
  TreeStructure,
  User,
  UsersThree,
  Warning,
  WarningCircle,
  Wheelchair,
  X,
} from "./icons.redesign";

const wrappers: Array<
  [string, ComponentType<{ size?: number; className?: string }>]
> = [
  ["ArrowRight", ArrowRight],
  ["ArrowsOut", ArrowsOut],
  ["Bus", Bus],
  ["Car", Car],
  ["CaretDown", CaretDown],
  ["CaretLeft", CaretLeft],
  ["CaretRight", CaretRight],
  ["CaretUp", CaretUp],
  ["CheckCircle", CheckCircle],
  ["Coffee", Coffee],
  ["DownloadSimple", DownloadSimple],
  ["Envelope", Envelope],
  ["Eye", Eye],
  ["FileText", FileText],
  ["FirstAid", FirstAid],
  ["Handshake", Handshake],
  ["Heart", Heart],
  ["House", House],
  ["Info", Info],
  ["List", List],
  ["MagnifyingGlass", MagnifyingGlass],
  ["MapPin", MapPin],
  ["Phone", Phone],
  ["Question", Question],
  ["ShieldCheck", ShieldCheck],
  ["SoccerBall", SoccerBall],
  ["Sparkle", Sparkle],
  ["Ticket", Ticket],
  ["TreeStructure", TreeStructure],
  ["User", User],
  ["UsersThree", UsersThree],
  ["Warning", Warning],
  ["WarningCircle", WarningCircle],
  ["Wheelchair", Wheelchair],
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

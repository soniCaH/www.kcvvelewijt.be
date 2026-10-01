import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoundAvatar } from "./RoundAvatar";

function root(container: HTMLElement) {
  return container.firstElementChild as HTMLElement;
}

describe("<RoundAvatar>", () => {
  describe("photo", () => {
    it("renders the photo when a photoUrl is supplied, with no monogram", () => {
      const { container } = render(
        <RoundAvatar size={40} name="Luc Boons" photoUrl="/x/luc.jpg" />,
      );
      expect(root(container).getAttribute("data-round-avatar")).toBe("photo");
      const img = container.querySelector("img");
      expect(img?.getAttribute("src")).toBe("/x/luc.jpg");
      expect(img?.getAttribute("alt")).toBe("");
      expect(container.textContent).toBe("");
    });

    it.each([null, undefined, "", "   "])(
      "falls back to the monogram when photoUrl is %j",
      (photoUrl) => {
        const { container } = render(
          <RoundAvatar size={40} name="Luc Boons" photoUrl={photoUrl} />,
        );
        expect(root(container).getAttribute("data-round-avatar")).toBe(
          "monogram",
        );
        expect(container.querySelector("img")).toBeNull();
      },
    );
  });

  describe("monogram", () => {
    it("sets first + last initials for a full name", () => {
      const { container } = render(
        <RoundAvatar size={64} name="Jan De Smet" />,
      );
      expect(container.textContent).toBe("JS");
    });

    it("sets one letter when only a first name is known", () => {
      const { container } = render(<RoundAvatar size={24} name="anouk" />);
      expect(container.textContent).toBe("A");
    });

    it("sets a middot when there is no name to derive from", () => {
      const { container } = render(<RoundAvatar size={40} />);
      expect(container.textContent).toBe("·");
    });

    it("never draws the jersey figure", () => {
      const { container } = render(<RoundAvatar size={64} name="Luc Boons" />);
      expect(container.querySelector("svg")).toBeNull();
    });

    it("sets an explicit glyph instead of initials, for a count or a vacancy", () => {
      const { container } = render(
        <RoundAvatar size={40} name="Luc Boons" glyph="+2" />,
      );
      expect(container.textContent).toBe("+2");
    });
  });

  describe("size ramp", () => {
    it.each([24, 40, 64] as const)("reports its %ipx step", (size) => {
      const { container } = render(<RoundAvatar size={size} name="Luc" />);
      expect(root(container).getAttribute("data-size")).toBe(String(size));
    });

    it("rings 24px at 1px and 40/64px at 2px", () => {
      const ring = (size: 24 | 40 | 64) =>
        root(render(<RoundAvatar size={size} name="Luc" />).container)
          .className;
      expect(ring(24)).toMatch(/\bborder\b/);
      expect(ring(24)).not.toMatch(/\bborder-2\b/);
      expect(ring(40)).toMatch(/\bborder-2\b/);
      expect(ring(64)).toMatch(/\bborder-2\b/);
    });
  });

  it("is silent to assistive tech — the name sits beside it", () => {
    const { container } = render(<RoundAvatar size={40} name="Luc Boons" />);
    expect(root(container).getAttribute("aria-hidden")).toBe("true");
  });

  it("forwards className to the root", () => {
    const { container } = render(
      <RoundAvatar size={40} name="Luc" className="z-30" />,
    );
    expect(root(container).className).toContain("z-30");
  });
});

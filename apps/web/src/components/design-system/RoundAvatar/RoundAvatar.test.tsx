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

    describe("fetch weight (a 64px disc must not download a 600px photo)", () => {
      const sanity = (query: string) =>
        `https://cdn.sanity.io/images/p/d/abc-600x800.jpg?${query}`;
      const srcOf = (size: 24 | 40 | 64, photoUrl: string) =>
        render(<RoundAvatar size={size} photoUrl={photoUrl} />)
          .container.querySelector("img")
          ?.getAttribute("src");

      it.each([
        [24, 48],
        [40, 80],
        [64, 128],
      ] as const)(
        "caps a Sanity w= at twice the %ipx step (%i)",
        (size, cap) => {
          const src = srcOf(size, sanity("w=600&q=80&fm=webp&fit=max"));
          const params = new URL(src!).searchParams;
          expect(params.get("w")).toBe(String(cap));
          expect(params.get("q")).toBe("80");
          expect(params.get("fm")).toBe("webp");
          expect(params.get("fit")).toBe("max");
        },
      );

      it("never raises a w= that is already smaller", () => {
        const src = srcOf(64, sanity("w=100&fit=max"));
        expect(new URL(src!).searchParams.get("w")).toBe("100");
      });

      it("adds a w= to a Sanity URL that has none", () => {
        const src = srcOf(
          40,
          "https://cdn.sanity.io/images/p/d/abc-600x800.jpg",
        );
        expect(new URL(src!).searchParams.get("w")).toBe("80");
      });

      it("leaves a non-Sanity URL alone", () => {
        expect(srcOf(40, "https://picsum.photos/seed/x/600/800?w=600")).toBe(
          "https://picsum.photos/seed/x/600/800?w=600",
        );
      });
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
        root(
          render(<RoundAvatar size={size} name="Luc" />).container,
        ).className.split(/\s+/);
      expect(ring(24)).toContain("border");
      expect(ring(24)).not.toContain("border-2");
      expect(ring(40)).toContain("border-2");
      expect(ring(40)).not.toContain("border");
      expect(ring(64)).toContain("border-2");
      expect(ring(64)).not.toContain("border");
    });
  });

  it("tells a glyph circle from a monogram", () => {
    const { container } = render(<RoundAvatar size={40} glyph="+2" />);
    expect(root(container).getAttribute("data-round-avatar")).toBe("glyph");
  });

  it("shows a plain photo with no newsprint filter or multiply blend", () => {
    const { container } = render(
      <RoundAvatar size={40} name="KCVV" photoUrl="/crest.png" plainPhoto />,
    );
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.style.filter).toBe("");
    expect(img.className).not.toContain("mix-blend-multiply");
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

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SectionTransition } from "./SectionTransition";

// happy-dom strips clamp()/calc() from inline style properties, so we verify
// those computed values via data-* attributes that the component exposes.

describe("SectionTransition", () => {
  describe("diagonal type", () => {
    it("renders wrapper with aria-hidden", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
        />,
      );
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });

    it("applies diagonal height via --footer-diagonal CSS var", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.getAttribute("data-height")).toBe("var(--footer-diagonal)");
    });

    it("renders SVG with crispEdges for direction=left", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
        />,
      );
      const svg = container.querySelector("svg") as SVGElement;
      expect(svg).not.toBeNull();
      expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
      expect(svg.getAttribute("preserveAspectRatio")).toBe("none");
      // TO polygon: lower-right triangle (↙ diagonal) — same as old
      // CLIP_PATH_TO["left"] = polygon(100% 0, 100% 100%, 0 100%)
      const toPolygon = svg.querySelector(
        "[data-testid='st-to']",
      ) as SVGPolygonElement;
      expect(toPolygon.getAttribute("points")).toBe("100,0 100,100 0,100");
      expect(toPolygon.getAttribute("shape-rendering")).toBe("crispEdges");
    });

    it("renders SVG with crispEdges for direction=right", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="right"
        />,
      );
      const svg = container.querySelector("svg") as SVGElement;
      expect(svg).not.toBeNull();
      // TO polygon: lower-left triangle (↘ diagonal) — same as old
      // CLIP_PATH_TO["right"] = polygon(0 0, 0 100%, 100% 100%)
      const toPolygon = svg.querySelector(
        "[data-testid='st-to']",
      ) as SVGPolygonElement;
      expect(toPolygon.getAttribute("points")).toBe("0,0 0,100 100,100");
      expect(toPolygon.getAttribute("shape-rendering")).toBe("crispEdges");
    });

    it("applies zero margin-top for overlap=none (no seam hacks needed)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          overlap="none"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.getAttribute("data-margin-top")).toBe("0");
    });

    it("applies negative margin-top for overlap=half (diagonal)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          overlap="half"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.getAttribute("data-margin-top")).toBe(
        "calc(-1 * clamp(1rem, 3vw, 2.5rem) - 1px)",
      );
    });

    it("applies negative margin-top for overlap=full (diagonal)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          overlap="full"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.getAttribute("data-margin-top")).toBe(
        "calc(-1 * var(--footer-diagonal) - 1px)",
      );
    });

    it("applies z-index 10 for overlap=half", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          overlap="half"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.zIndex).toBe("10");
    });

    it("applies z-index 1 for overlap=none (protects opaque triangle against backdrop overflow)", () => {
      // §5.1 — new constraint introduced by backdrop support. Without z-index:1
      // on non-overlap transitions, a backdropped neighbor's negative-top layer
      // paints above the transition and obscures the opaque triangle.
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.zIndex).toBe("1");
    });
  });

  describe("double-diagonal type", () => {
    it("applies double height for double-diagonal", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="double-diagonal"
          direction="right"
          via="white"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.getAttribute("data-height")).toBe(
        "calc(2 * var(--footer-diagonal))",
      );
    });

    it("renders single SVG with four polygons (no mid-seam)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="double-diagonal"
          direction="right"
          via="white"
        />,
      );
      // Single SVG eliminates mid-seam between the two halves
      const svgs = container.querySelectorAll("svg");
      expect(svgs).toHaveLength(1);
      // viewBox spans both halves: 0 0 100 200
      expect(svgs[0].getAttribute("viewBox")).toBe("0 0 100 200");
      const polygons = svgs[0].querySelectorAll("polygon");
      expect(polygons).toHaveLength(4);
    });

    it("SVG polygons have correct points for direction=right", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="double-diagonal"
          direction="right"
          via="white"
        />,
      );
      const svg = container.querySelector("svg") as SVGElement;
      // Upper half: direction=right
      // FROM upper-right: 0,0 100,0 100,100 → shifted to top half (y 0-100)
      const upperFrom = svg.querySelector(
        "[data-testid='st-upper-from']",
      ) as SVGPolygonElement;
      expect(upperFrom.getAttribute("points")).toBe("0,0 100,0 100,100");
      // TO lower-left: 0,0 0,100 100,100
      const upperTo = svg.querySelector(
        "[data-testid='st-upper-to']",
      ) as SVGPolygonElement;
      expect(upperTo.getAttribute("points")).toBe("0,0 0,100 100,100");
      // Lower half: opposite=left, shifted to y 100-200
      // FROM upper-left: 0,100 100,100 0,200
      const lowerFrom = svg.querySelector(
        "[data-testid='st-lower-from']",
      ) as SVGPolygonElement;
      expect(lowerFrom.getAttribute("points")).toBe("0,100 100,100 0,200");
      // TO lower-right: 100,100 100,200 0,200
      const lowerTo = svg.querySelector(
        "[data-testid='st-lower-to']",
      ) as SVGPolygonElement;
      expect(lowerTo.getAttribute("points")).toBe("100,100 100,200 0,200");
    });

    it("applies negative margin for overlap=half on double-diagonal", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="double-diagonal"
          direction="right"
          via="white"
          overlap="half"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.getAttribute("data-margin-top")).toBe(
        "calc(-1 * var(--footer-diagonal) - 1px)",
      );
    });
  });

  // Reveal flags — backdrop support (PRD §5.2, §5.3, §5.4, §5.5)
  describe("reveal flags", () => {
    it("FROM polygon is transparent when revealFrom=true (non-overlap)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          revealFrom
        />,
      );
      const fromPolygon = container.querySelector(
        "[data-testid='st-from']",
      ) as SVGPolygonElement;
      expect(fromPolygon.getAttribute("fill")).toBe("transparent");
    });

    it("TO polygon is transparent when revealTo=true (non-overlap)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          revealTo
        />,
      );
      const toPolygon = container.querySelector(
        "[data-testid='st-to']",
      ) as SVGPolygonElement;
      expect(toPolygon.getAttribute("fill")).toBe("transparent");
    });

    it("FROM polygon is opaque (BG_COLOR[from]) when no reveal flag and overlap=none", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
        />,
      );
      const fromPolygon = container.querySelector(
        "[data-testid='st-from']",
      ) as SVGPolygonElement;
      expect(fromPolygon.getAttribute("fill")).toBe("#1E2024");
    });

    it("TO polygon is opaque (BG_COLOR[to]) when revealTo is not set", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
        />,
      );
      const toPolygon = container.querySelector(
        "[data-testid='st-to']",
      ) as SVGPolygonElement;
      expect(toPolygon.getAttribute("fill")).toBe("#f3f4f6");
    });

    it("wrapper background is transparent when revealFrom is truthy (§5.2)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          revealFrom
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.background).toBe("transparent");
    });

    it("wrapper background is transparent when revealTo is truthy (§5.2)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          revealTo
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.background).toBe("transparent");
    });

    it("wrapper background is transparent when BOTH reveal flags are truthy (§5.5)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-green-dark"
          to="kcvv-black"
          type="diagonal"
          direction="left"
          revealFrom
          revealTo
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.background).toBe("transparent");
    });

    it("two-consecutive-backdrop case: both triangles transparent (§5.5)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-green-dark"
          to="kcvv-black"
          type="diagonal"
          direction="left"
          revealFrom
          revealTo
        />,
      );
      const fromPolygon = container.querySelector(
        "[data-testid='st-from']",
      ) as SVGPolygonElement;
      const toPolygon = container.querySelector(
        "[data-testid='st-to']",
      ) as SVGPolygonElement;
      expect(fromPolygon.getAttribute("fill")).toBe("transparent");
      expect(toPolygon.getAttribute("fill")).toBe("transparent");
    });

    it("overlap=half: FROM stays transparent (existing overlap behavior preserved)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          overlap="half"
        />,
      );
      const fromPolygon = container.querySelector(
        "[data-testid='st-from']",
      ) as SVGPolygonElement;
      expect(fromPolygon.getAttribute("fill")).toBe("transparent");
    });

    it("overlap=half: wrapper background remains the step gradient when no reveal flag (§5.2)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          overlap="half"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.background).toContain("linear-gradient");
    });

    it("overlap=half + revealFrom: wrapper background drops to transparent (reveal rule wins over overlap)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          overlap="half"
          revealFrom
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.background).toBe("transparent");
    });

    it("revealFrom does not affect TO polygon fill (§5.3 — reveal flags override only their side)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          revealFrom
        />,
      );
      const toPolygon = container.querySelector(
        "[data-testid='st-to']",
      ) as SVGPolygonElement;
      expect(toPolygon.getAttribute("fill")).toBe("#f3f4f6");
    });

    it("revealTo does not affect FROM polygon fill (§5.3 — reveal flags override only their side)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          revealTo
        />,
      );
      const fromPolygon = container.querySelector(
        "[data-testid='st-from']",
      ) as SVGPolygonElement;
      expect(fromPolygon.getAttribute("fill")).toBe("#1E2024");
    });

    it("z-index on non-overlap transition is stable (=1) regardless of reveal flags (§5.1)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          revealFrom
          revealTo
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.zIndex).toBe("1");
    });

    it("z-index on overlap transition is stable (=10) regardless of reveal flags (§5.1)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
          overlap="half"
          revealFrom
          revealTo
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.zIndex).toBe("10");
    });
  });

  // Double-diagonal reveal composition (PRD §5.4)
  describe("reveal flags — double-diagonal composition", () => {
    it("revealFrom makes upper-FROM polygon transparent; upper 'via' polygon stays opaque", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="kcvv-green-dark"
          type="double-diagonal"
          direction="right"
          via="white"
          revealFrom
        />,
      );
      const upperFrom = container.querySelector(
        "[data-testid='st-upper-from']",
      ) as SVGPolygonElement;
      const upperTo = container.querySelector(
        "[data-testid='st-upper-to']",
      ) as SVGPolygonElement;
      expect(upperFrom.getAttribute("fill")).toBe("transparent");
      // via color — always opaque per §5.4 (via is not a reveal surface)
      expect(upperTo.getAttribute("fill")).toBe("#ffffff");
    });

    it("revealFrom does NOT affect the lower half polygons (§5.4)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="kcvv-green-dark"
          type="double-diagonal"
          direction="right"
          via="white"
          revealFrom
        />,
      );
      const lowerFrom = container.querySelector(
        "[data-testid='st-lower-from']",
      ) as SVGPolygonElement;
      const lowerTo = container.querySelector(
        "[data-testid='st-lower-to']",
      ) as SVGPolygonElement;
      // Lower FROM is the via color — always opaque
      expect(lowerFrom.getAttribute("fill")).toBe("#ffffff");
      // Lower TO is BG_COLOR[to] — unchanged by revealFrom
      expect(lowerTo.getAttribute("fill")).toBe("#008755");
    });

    it("revealTo makes lower-TO polygon transparent; lower 'via' polygon stays opaque", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="kcvv-green-dark"
          type="double-diagonal"
          direction="right"
          via="white"
          revealTo
        />,
      );
      const lowerFrom = container.querySelector(
        "[data-testid='st-lower-from']",
      ) as SVGPolygonElement;
      const lowerTo = container.querySelector(
        "[data-testid='st-lower-to']",
      ) as SVGPolygonElement;
      // via color — always opaque
      expect(lowerFrom.getAttribute("fill")).toBe("#ffffff");
      expect(lowerTo.getAttribute("fill")).toBe("transparent");
    });

    it("revealTo does NOT affect the upper half polygons (§5.4)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="kcvv-green-dark"
          type="double-diagonal"
          direction="right"
          via="white"
          revealTo
        />,
      );
      const upperFrom = container.querySelector(
        "[data-testid='st-upper-from']",
      ) as SVGPolygonElement;
      const upperTo = container.querySelector(
        "[data-testid='st-upper-to']",
      ) as SVGPolygonElement;
      // Upper FROM is BG_COLOR[from] — unchanged by revealTo
      expect(upperFrom.getAttribute("fill")).toBe("#1E2024");
      expect(upperTo.getAttribute("fill")).toBe("#ffffff");
    });

    it("both reveal flags on double-diagonal: via polygons stay opaque, outer polygons transparent", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="kcvv-green-dark"
          type="double-diagonal"
          direction="right"
          via="white"
          revealFrom
          revealTo
        />,
      );
      const upperFrom = container.querySelector(
        "[data-testid='st-upper-from']",
      ) as SVGPolygonElement;
      const upperTo = container.querySelector(
        "[data-testid='st-upper-to']",
      ) as SVGPolygonElement;
      const lowerFrom = container.querySelector(
        "[data-testid='st-lower-from']",
      ) as SVGPolygonElement;
      const lowerTo = container.querySelector(
        "[data-testid='st-lower-to']",
      ) as SVGPolygonElement;
      expect(upperFrom.getAttribute("fill")).toBe("transparent");
      expect(upperTo.getAttribute("fill")).toBe("#ffffff");
      expect(lowerFrom.getAttribute("fill")).toBe("#ffffff");
      expect(lowerTo.getAttribute("fill")).toBe("transparent");
    });
  });
});

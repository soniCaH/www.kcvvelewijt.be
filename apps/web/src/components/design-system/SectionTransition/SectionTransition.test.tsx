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

    it("applies clamp height for diagonal", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.getAttribute("data-height")).toBe("clamp(2rem, 6vw, 5rem)");
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
        "calc(-1 * clamp(2rem, 6vw, 5rem) - 1px)",
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

    it("does not apply z-index for overlap=none", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.zIndex).toBe("");
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
        "calc(2 * clamp(2rem, 6vw, 5rem))",
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
        "calc(-1 * clamp(2rem, 6vw, 5rem) - 1px)",
      );
    });
  });
});

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

    it("uses gradient background for direction=left (no clip-path)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
        />,
      );
      const el = container.firstChild as HTMLElement;
      // Single element with gradient — no clip-path children
      expect(el.querySelector("[style*='clip-path']")).toBeNull();
      expect(el.style.background).toContain("linear-gradient");
      expect(el.style.background).toContain("to bottom left");
    });

    it("uses gradient background for direction=right (no clip-path)", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="right"
        />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.querySelector("[style*='clip-path']")).toBeNull();
      expect(el.style.background).toContain("linear-gradient");
      expect(el.style.background).toContain("to bottom right");
    });

    it("applies zero margin-top for overlap=none (gradient eliminates seam)", () => {
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
        "calc(-1 * clamp(1rem, 3vw, 2.5rem))",
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
        "calc(-1 * clamp(2rem, 6vw, 5rem))",
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

    it("renders two sub-dividers for double-diagonal", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="double-diagonal"
          direction="right"
          via="white"
        />,
      );
      const overlays = container.querySelectorAll("[data-testid='st-sub']");
      expect(overlays).toHaveLength(2);
    });

    it("sub-dividers use gradients with opposite directions", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="double-diagonal"
          direction="right"
          via="white"
        />,
      );
      const subs = container.querySelectorAll(
        "[data-testid='st-sub']",
      ) as NodeListOf<HTMLElement>;
      // direction=right → first half gradient goes "to bottom right"
      expect(subs[0].style.background).toContain("to bottom right");
      // opposite=left → second half gradient goes "to bottom left"
      expect(subs[1].style.background).toContain("to bottom left");
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
        "calc(-1 * clamp(2rem, 6vw, 5rem))",
      );
    });
  });
});

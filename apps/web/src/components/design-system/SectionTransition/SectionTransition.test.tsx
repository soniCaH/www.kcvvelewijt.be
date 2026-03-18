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

    it("renders clip-path overlay for direction=left", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="left"
        />,
      );
      const overlay = container.querySelector(
        "[data-testid='st-overlay']",
      ) as HTMLElement;
      expect(overlay.style.clipPath).toBe("polygon(100% 0, 100% 100%, 0 100%)");
    });

    it("renders clip-path overlay for direction=right", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="diagonal"
          direction="right"
        />,
      );
      const overlay = container.querySelector(
        "[data-testid='st-overlay']",
      ) as HTMLElement;
      expect(overlay.style.clipPath).toBe("polygon(0 0, 0 100%, 100% 100%)");
    });

    it("applies no margin-top for overlap=none (default)", () => {
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
      expect(el.getAttribute("data-margin-top")).toBeNull();
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

    it("second sub-divider has opposite direction from first", () => {
      const { container } = render(
        <SectionTransition
          from="kcvv-black"
          to="gray-100"
          type="double-diagonal"
          direction="right"
          via="white"
        />,
      );
      const overlays = container.querySelectorAll(
        "[data-testid='st-sub-overlay']",
      ) as NodeListOf<HTMLElement>;
      // direction=right → first overlay polygon(0 0, 0 100%, 100% 100%)
      expect(overlays[0].style.clipPath).toBe(
        "polygon(0 0, 0 100%, 100% 100%)",
      );
      // opposite = left → polygon(100% 0, 100% 100%, 0 100%)
      expect(overlays[1].style.clipPath).toBe(
        "polygon(100% 0, 100% 100%, 0 100%)",
      );
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

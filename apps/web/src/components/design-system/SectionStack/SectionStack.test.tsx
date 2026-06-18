import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionStack } from "./SectionStack";
import type { SectionConfig } from "./SectionStack";
import {
  STRIPED_SEAM_HEIGHT_PX,
  type StripedSeamHeight,
} from "@/components/design-system/StripedSeam";

const seam = (
  height: StripedSeamHeight = "md",
): NonNullable<SectionConfig["transition"]> => ({
  type: "striped-seam",
  height,
  colorPair: "ink-cream",
});

const makeSection = (
  bg: SectionConfig["bg"],
  label: string,
  transition?: SectionConfig["transition"],
): SectionConfig => ({
  bg,
  content: <div data-testid={`section-${label}`}>{label}</div>,
  key: label,
  transition,
});

describe("SectionStack", () => {
  it("filters null entries", () => {
    render(
      <SectionStack
        sections={[
          makeSection("gray-100", "A"),
          null,
          makeSection("jersey-deep", "B"),
        ]}
      />,
    );
    expect(screen.getByTestId("section-A")).toBeInTheDocument();
    expect(screen.getByTestId("section-B")).toBeInTheDocument();
  });

  it("filters false entries", () => {
    render(
      <SectionStack
        sections={[
          makeSection("gray-100", "A"),
          false,
          makeSection("jersey-deep", "B"),
        ]}
      />,
    );
    expect(screen.getByTestId("section-A")).toBeInTheDocument();
    expect(screen.getByTestId("section-B")).toBeInTheDocument();
  });

  it("filters undefined entries", () => {
    render(
      <SectionStack
        sections={[
          makeSection("gray-100", "A"),
          undefined,
          makeSection("jersey-deep", "B"),
        ]}
      />,
    );
    expect(screen.getByTestId("section-A")).toBeInTheDocument();
    expect(screen.getByTestId("section-B")).toBeInTheDocument();
  });

  it("renders correct number of sections after filtering", () => {
    render(
      <SectionStack
        sections={[
          makeSection("gray-100", "A"),
          null,
          false,
          makeSection("jersey-deep", "B"),
          makeSection("white", "C"),
        ]}
      />,
    );
    expect(screen.getByTestId("section-A")).toBeInTheDocument();
    expect(screen.getByTestId("section-B")).toBeInTheDocument();
    expect(screen.getByTestId("section-C")).toBeInTheDocument();
  });

  it("renders a seam between sections with differing bg", () => {
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("jersey-deep", "A", seam()),
          makeSection("gray-100", "B"),
        ]}
      />,
    );
    const transitions = container.querySelectorAll(
      "[data-testid='section-transition']",
    );
    expect(transitions).toHaveLength(1);
  });

  it("skips the seam when adjacent bg values are equal", () => {
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("gray-100", "A", seam()),
          makeSection("gray-100", "B"),
        ]}
      />,
    );
    const transitions = container.querySelectorAll(
      "[data-testid='section-transition']",
    );
    expect(transitions).toHaveLength(0);
  });

  it("skips the seam when the FROM section has no transition config", () => {
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("jersey-deep", "A"),
          makeSection("gray-100", "B"),
        ]}
      />,
    );
    const transitions = container.querySelectorAll(
      "[data-testid='section-transition']",
    );
    expect(transitions).toHaveLength(0);
  });

  it("adapts the seam when a middle section is absent", () => {
    // A (jersey-deep) → [null] → B (gray-100): transition lives on A, null is
    // filtered, so A fires its seam into B.
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("jersey-deep", "A", seam()),
          null,
          makeSection("gray-100", "B"),
        ]}
      />,
    );
    const transitions = container.querySelectorAll(
      "[data-testid='section-transition']",
    );
    expect(transitions).toHaveLength(1);
  });

  it("applies default pt-20 pb-20 to section wrappers", () => {
    const { container } = render(
      <SectionStack sections={[makeSection("gray-100", "A")]} />,
    );
    expect(container.querySelector(".pt-20")).not.toBeNull();
    expect(container.querySelector(".pb-20")).not.toBeNull();
  });

  it("applies custom paddingTop and paddingBottom when specified", () => {
    const { container } = render(
      <SectionStack
        sections={[
          {
            ...makeSection("gray-100", "A"),
            paddingTop: "pt-0",
            paddingBottom: "pb-10",
          },
        ]}
      />,
    );
    expect(container.querySelector(".pt-0")).not.toBeNull();
    expect(container.querySelector(".pb-10")).not.toBeNull();
    expect(container.querySelector(".pt-20")).toBeNull();
  });

  it("applies the correct BG_CLASS to each section wrapper", () => {
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("jersey-deep", "A"),
          makeSection("gray-100", "B"),
          makeSection("white", "C"),
          makeSection("transparent", "D"),
        ]}
      />,
    );
    expect(container.querySelector(".bg-jersey-deep")).not.toBeNull();
    expect(container.querySelector(".bg-gray-100")).not.toBeNull();
    expect(container.querySelector(".bg-white")).not.toBeNull();
    expect(container.querySelector(".bg-transparent")).not.toBeNull();
  });

  // ─── Backdrop support ───────────────────────────────────────────────────────
  describe("backdrop", () => {
    it("renders the backdrop layer with aria-hidden and pointer-events-none", () => {
      const { getByTestId } = render(
        <SectionStack
          sections={[
            makeSection("gray-100", "A", seam()),
            {
              ...makeSection("jersey-deep", "B"),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
          ]}
        />,
      );
      const layer = getByTestId("section-backdrop");
      expect(layer.getAttribute("aria-hidden")).toBe("true");
      expect(layer.className).toContain("pointer-events-none");
      expect(getByTestId("backdrop-node")).toBeInTheDocument();
    });

    it("does not render a backdrop layer when backdrop is absent", () => {
      const { container } = render(
        <SectionStack sections={[makeSection("gray-100", "A")]} />,
      );
      expect(
        container.querySelectorAll("[data-testid='section-backdrop']"),
      ).toHaveLength(0);
    });

    it("positions the backdrop absolutely with z-0", () => {
      const { getByTestId } = render(
        <SectionStack
          sections={[
            {
              ...makeSection("jersey-deep", "B"),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
          ]}
        />,
      );
      const layer = getByTestId("section-backdrop");
      expect(layer.className).toContain("absolute");
      expect(layer.className).toContain("z-0");
    });

    // happy-dom strips calc() from inline style properties, so the computed
    // top/bottom values are exposed via data-* attributes for assertion.
    it("backdrop top extends into a previous seam by its bleed height (calc form)", () => {
      const { getByTestId } = render(
        <SectionStack
          sections={[
            makeSection("gray-100", "A", seam("lg")),
            {
              ...makeSection("jersey-deep", "B"),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
          ]}
        />,
      );
      const layer = getByTestId("section-backdrop");
      expect(layer.getAttribute("data-top")).toBe(
        `calc(-1 * ${STRIPED_SEAM_HEIGHT_PX.lg}px + 1px)`,
      );
    });

    it("backdrop top is 0 for the first section (no previous seam)", () => {
      const { getByTestId } = render(
        <SectionStack
          sections={[
            {
              ...makeSection("jersey-deep", "A"),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
            makeSection("gray-100", "B"),
          ]}
        />,
      );
      const layer = getByTestId("section-backdrop");
      expect(layer.getAttribute("data-top")).toBe("0");
    });

    it("backdrop bottom extends into a next seam by its bleed height (calc form)", () => {
      const { getByTestId } = render(
        <SectionStack
          sections={[
            {
              ...makeSection("jersey-deep", "A", seam("xl")),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
            makeSection("gray-100", "B"),
          ]}
        />,
      );
      const layer = getByTestId("section-backdrop");
      expect(layer.getAttribute("data-bottom")).toBe(
        `calc(-1 * ${STRIPED_SEAM_HEIGHT_PX.xl}px + 1px)`,
      );
    });

    it("backdrop bottom is 0 for the last section (no next seam)", () => {
      const { getByTestId } = render(
        <SectionStack
          sections={[
            makeSection("gray-100", "A", seam()),
            {
              ...makeSection("jersey-deep", "B"),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
          ]}
        />,
      );
      const layer = getByTestId("section-backdrop");
      expect(layer.getAttribute("data-bottom")).toBe("0");
    });

    it("backdrop bottom stays 0 when the next section shares the same bg (no seam)", () => {
      const { getByTestId } = render(
        <SectionStack
          sections={[
            {
              ...makeSection("jersey-deep", "A", seam()),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
            makeSection("jersey-deep", "B"),
          ]}
        />,
      );
      const layer = getByTestId("section-backdrop");
      expect(layer.getAttribute("data-bottom")).toBe("0");
    });

    it("treats `backdrop: false` as absent (null-marker semantics)", () => {
      const { queryByTestId } = render(
        <SectionStack
          sections={[
            makeSection("jersey-deep", "A", seam()),
            {
              ...makeSection("gray-100", "B"),
              backdrop: false,
            },
          ]}
        />,
      );
      expect(queryByTestId("section-backdrop")).toBeNull();
    });

    it("treats `backdrop: null` as absent", () => {
      const { queryByTestId } = render(
        <SectionStack
          sections={[
            makeSection("jersey-deep", "A", seam()),
            {
              ...makeSection("gray-100", "B"),
              backdrop: null,
            },
          ]}
        />,
      );
      expect(queryByTestId("section-backdrop")).toBeNull();
    });
  });
});

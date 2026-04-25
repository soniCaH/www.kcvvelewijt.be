import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionStack } from "./SectionStack";
import type { SectionConfig } from "./SectionStack";

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
          makeSection("kcvv-black", "B"),
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
          makeSection("kcvv-black", "B"),
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
          makeSection("kcvv-black", "B"),
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
          makeSection("kcvv-black", "B"),
          makeSection("kcvv-green-dark", "C"),
        ]}
      />,
    );
    expect(screen.getByTestId("section-A")).toBeInTheDocument();
    expect(screen.getByTestId("section-B")).toBeInTheDocument();
    expect(screen.getByTestId("section-C")).toBeInTheDocument();
  });

  it("renders SectionTransition between sections with differing bg", () => {
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("kcvv-black", "A", {
            type: "diagonal",
            direction: "left",
          }),
          makeSection("gray-100", "B"),
        ]}
      />,
    );
    // SectionTransition renders aria-hidden div
    const transitions = container.querySelectorAll("[aria-hidden='true']");
    expect(transitions.length).toBeGreaterThan(0);
  });

  it("skips SectionTransition when adjacent bg values are equal", () => {
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("gray-100", "A", { type: "diagonal", direction: "left" }),
          makeSection("gray-100", "B"),
        ]}
      />,
    );
    const transitions = container.querySelectorAll("[aria-hidden='true']");
    expect(transitions).toHaveLength(0);
  });

  it("adapts transition when middle section is absent", () => {
    // A (black) → [null] → B (gray-100)
    // transition is configured on A; null is filtered; A fires transition into B
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("kcvv-black", "A", {
            type: "diagonal",
            direction: "left",
          }),
          null,
          makeSection("gray-100", "B"),
        ]}
      />,
    );
    const transitions = container.querySelectorAll("[aria-hidden='true']");
    expect(transitions.length).toBeGreaterThan(0);
  });

  it("applies default pt-20 pb-20 to section wrappers", () => {
    const { container } = render(
      <SectionStack sections={[makeSection("gray-100", "A")]} />,
    );
    const wrapper = container.querySelector(".pt-20");
    expect(wrapper).not.toBeNull();
    const pbWrapper = container.querySelector(".pb-20");
    expect(pbWrapper).not.toBeNull();
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

  it("applies bg class to section wrapper", () => {
    const { container } = render(
      <SectionStack sections={[makeSection("kcvv-black", "A")]} />,
    );
    expect(container.querySelector(".bg-kcvv-black")).not.toBeNull();
  });

  it("does not apply -mt-px (SVG crispEdges eliminates seam)", () => {
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("kcvv-black", "A", {
            type: "diagonal",
            direction: "left",
          }),
          makeSection("gray-100", "B"),
        ]}
      />,
    );
    expect(container.querySelector(".-mt-px")).toBeNull();
  });

  it("applies position relative z-0 to FROM section when its transition has overlap", () => {
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("kcvv-black", "A", {
            type: "diagonal",
            direction: "left",
            overlap: "half",
          }),
          makeSection("gray-100", "B"),
        ]}
      />,
    );
    // The FROM section wrapper should have relative + z-0
    const fromWrapper = container.querySelector(".z-0");
    expect(fromWrapper).not.toBeNull();
  });

  it("reserves the footer-diagonal safe area on the last section by default", () => {
    const { container } = render(
      <SectionStack
        sections={[
          makeSection("gray-100", "A"),
          makeSection("kcvv-black", "B"),
        ]}
      />,
    );
    const reserved = container.querySelectorAll(
      ".pb-\\[var\\(--footer-diagonal\\)\\]",
    );
    // Exactly one wrapper extends the bg through the footer overlap zone.
    expect(reserved).toHaveLength(1);
    // It sits on the last section (its bg is kcvv-black here).
    expect(reserved[0]!.classList.contains("bg-kcvv-black")).toBe(true);
  });

  it("skips the footer safe area when reserveFooterSafeArea is false", () => {
    const { container } = render(
      <SectionStack
        reserveFooterSafeArea={false}
        sections={[
          makeSection("gray-100", "A"),
          makeSection("kcvv-black", "B"),
        ]}
      />,
    );
    const reserved = container.querySelector(
      ".pb-\\[var\\(--footer-diagonal\\)\\]",
    );
    expect(reserved).toBeNull();
  });

  // Backdrop support (PRD §5.1, §5.6, §6 AC)
  describe("backdrop", () => {
    it("renders backdrop node with aria-hidden and pointer-events-none", () => {
      const { getByTestId } = render(
        <SectionStack
          sections={[
            makeSection("gray-100", "A", {
              type: "diagonal",
              direction: "left",
            }),
            {
              ...makeSection("kcvv-green-dark", "B"),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
          ]}
        />,
      );
      const backdrop = getByTestId("backdrop-node");
      const layer = backdrop.parentElement as HTMLElement;
      expect(layer.getAttribute("aria-hidden")).toBe("true");
      expect(layer.className).toContain("pointer-events-none");
    });

    it("does not render a backdrop wrapper when backdrop is absent", () => {
      const { container } = render(
        <SectionStack sections={[makeSection("gray-100", "A")]} />,
      );
      const layers = container.querySelectorAll(
        "[data-testid='section-backdrop']",
      );
      expect(layers).toHaveLength(0);
    });

    it("positions backdrop absolutely with z-0 inside the section wrapper", () => {
      const { getByTestId } = render(
        <SectionStack
          sections={[
            {
              ...makeSection("kcvv-green-dark", "B"),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
          ]}
        />,
      );
      const layer = getByTestId("backdrop-node").parentElement as HTMLElement;
      expect(layer.className).toContain("absolute");
      expect(layer.className).toContain("z-0");
    });

    // happy-dom strips calc() from inline style properties, so verify those
    // computed values via data-* attributes the component exposes (consistent
    // with the SectionTransition data-height / data-margin-top pattern).
    it("backdrop top extends by footer-diagonal when a previous (non-overlap) transition exists, with +1px seam-guard adjustment (§5.1)", () => {
      // The +1px compensates for SectionTransition's marginBottom: -1px so
      // the backdrop top aligns exactly with the transition top instead of
      // overflowing 1px into the previous section as a visible hairline.
      const { getByTestId } = render(
        <SectionStack
          sections={[
            makeSection("gray-100", "A", {
              type: "diagonal",
              direction: "left",
            }),
            {
              ...makeSection("kcvv-green-dark", "B"),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
          ]}
        />,
      );
      const layer = getByTestId("backdrop-node").parentElement as HTMLElement;
      expect(layer.getAttribute("data-top")).toBe(
        "calc(-1 * var(--footer-diagonal) + 1px)",
      );
    });

    it("backdrop top uses bare footer-diagonal when the previous transition is overlap (no +1px needed)", () => {
      // Overlap transitions land the backdrop top at the transition top
      // naturally because of their negative marginTop; no +1px adjustment.
      const { getByTestId } = render(
        <SectionStack
          sections={[
            makeSection("kcvv-black", "A", {
              type: "diagonal",
              direction: "left",
              overlap: "half",
            }),
            {
              ...makeSection("kcvv-green-dark", "B"),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
          ]}
        />,
      );
      const layer = getByTestId("backdrop-node").parentElement as HTMLElement;
      expect(layer.getAttribute("data-top")).toBe(
        "calc(-1 * var(--footer-diagonal))",
      );
    });

    it("backdrop top is 0 when no previous transition exists — first section (§5.6)", () => {
      const { getByTestId } = render(
        <SectionStack
          sections={[
            {
              ...makeSection("kcvv-green-dark", "A"),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
            makeSection("gray-100", "B"),
          ]}
        />,
      );
      const layer = getByTestId("backdrop-node").parentElement as HTMLElement;
      expect(layer.getAttribute("data-top")).toBe("0");
    });

    it("backdrop bottom extends by footer-diagonal when a next (non-overlap) transition exists, with +1px seam-guard adjustment", () => {
      // Symmetric to the top adjustment: the +1px lands the backdrop bottom
      // at the next section's top rather than 1px past it.
      const { getByTestId } = render(
        <SectionStack
          sections={[
            {
              ...makeSection("kcvv-green-dark", "A", {
                type: "diagonal",
                direction: "left",
              }),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
            makeSection("gray-100", "B"),
          ]}
        />,
      );
      const layer = getByTestId("backdrop-node").parentElement as HTMLElement;
      expect(layer.getAttribute("data-bottom")).toBe(
        "calc(-1 * var(--footer-diagonal) + 1px)",
      );
    });

    it("backdrop bottom is 0 when no next transition exists — last section (§5.6)", () => {
      const { getByTestId } = render(
        <SectionStack
          sections={[
            makeSection("gray-100", "A", {
              type: "diagonal",
              direction: "left",
            }),
            {
              ...makeSection("kcvv-green-dark", "B"),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
          ]}
        />,
      );
      const layer = getByTestId("backdrop-node").parentElement as HTMLElement;
      expect(layer.getAttribute("data-bottom")).toBe("0");
    });

    it("backdrop bottom remains 0 when the next section shares the same bg (no transition rendered)", () => {
      const { getByTestId } = render(
        <SectionStack
          sections={[
            {
              ...makeSection("kcvv-green-dark", "A", {
                type: "diagonal",
                direction: "left",
              }),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
            makeSection("kcvv-green-dark", "B"),
          ]}
        />,
      );
      const layer = getByTestId("backdrop-node").parentElement as HTMLElement;
      expect(layer.getAttribute("data-bottom")).toBe("0");
    });

    it("auto-propagates revealTo on previous section's transition when current section has backdrop (§6 AC)", () => {
      const { container } = render(
        <SectionStack
          sections={[
            makeSection("gray-100", "A", {
              type: "diagonal",
              direction: "left",
            }),
            {
              ...makeSection("kcvv-green-dark", "B"),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
          ]}
        />,
      );
      // Only one transition between A → B. The TO triangle should be transparent.
      const toPolygon = container.querySelector(
        "[data-testid='st-to']",
      ) as SVGPolygonElement;
      expect(toPolygon.getAttribute("fill")).toBe("transparent");
    });

    it("auto-propagates revealFrom on next section's transition when current section has backdrop", () => {
      const { container } = render(
        <SectionStack
          sections={[
            {
              ...makeSection("kcvv-green-dark", "A", {
                type: "diagonal",
                direction: "left",
              }),
              backdrop: <div data-testid="backdrop-node">BACKDROP</div>,
            },
            makeSection("gray-100", "B"),
          ]}
        />,
      );
      const fromPolygon = container.querySelector(
        "[data-testid='st-from']",
      ) as SVGPolygonElement;
      expect(fromPolygon.getAttribute("fill")).toBe("transparent");
    });

    it("does not set reveal flags on transitions whose neighbors have no backdrop", () => {
      const { container } = render(
        <SectionStack
          sections={[
            makeSection("kcvv-black", "A", {
              type: "diagonal",
              direction: "left",
            }),
            makeSection("gray-100", "B"),
          ]}
        />,
      );
      const fromPolygon = container.querySelector(
        "[data-testid='st-from']",
      ) as SVGPolygonElement;
      const toPolygon = container.querySelector(
        "[data-testid='st-to']",
      ) as SVGPolygonElement;
      // FROM is opaque BG_COLOR[kcvv-black], TO is opaque BG_COLOR[gray-100]
      expect(fromPolygon.getAttribute("fill")).toBe("#1E2024");
      expect(toPolygon.getAttribute("fill")).toBe("#f3f4f6");
    });

    it("two consecutive backdropped sections: adjacent transition is fully transparent (§5.5)", () => {
      const { container } = render(
        <SectionStack
          sections={[
            {
              ...makeSection("kcvv-green-dark", "A", {
                type: "diagonal",
                direction: "left",
              }),
              backdrop: <div data-testid="backdrop-a">A-BACKDROP</div>,
            },
            {
              ...makeSection("kcvv-black", "B"),
              backdrop: <div data-testid="backdrop-b">B-BACKDROP</div>,
            },
          ]}
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
  });
});

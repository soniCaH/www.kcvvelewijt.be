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
});

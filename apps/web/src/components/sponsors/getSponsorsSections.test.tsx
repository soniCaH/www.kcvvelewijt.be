import { describe, it, expect } from "vitest";
import { getSponsorsSections } from "./getSponsorsSections";

describe("getSponsorsSections", () => {
  it("returns 4 sections with correct keys, backgrounds, and transitions when spotlight is provided", () => {
    const sections = getSponsorsSections({
      header: <div data-testid="header" />,
      spotlight: <div data-testid="spotlight" />,
      grid: <div data-testid="grid" />,
      cta: <div data-testid="cta" />,
    });

    expect(sections).toHaveLength(4);

    // Header — kcvv-black bg, pt-16 pb-24, diagonal right with full overlap
    expect(sections[0].key).toBe("header");
    expect(sections[0].bg).toBe("kcvv-black");
    expect(sections[0].paddingTop).toBe("pt-16");
    expect(sections[0].paddingBottom).toBe("pb-24");
    expect(sections[0].transition).toEqual({
      type: "diagonal",
      direction: "right",
      overlap: "full",
    });

    // Spotlight — kcvv-green-dark bg, no padding, diagonal right
    expect(sections[1].key).toBe("spotlight");
    expect(sections[1].bg).toBe("kcvv-green-dark");
    expect(sections[1].paddingTop).toBe("pt-0");
    expect(sections[1].paddingBottom).toBe("pb-0");
    expect(sections[1].transition).toEqual({
      type: "diagonal",
      direction: "right",
    });

    // Grid — gray-100 bg, no padding, diagonal left
    expect(sections[2].key).toBe("grid");
    expect(sections[2].bg).toBe("gray-100");
    expect(sections[2].paddingTop).toBe("pt-0");
    expect(sections[2].paddingBottom).toBe("pb-0");
    expect(sections[2].transition).toEqual({
      type: "diagonal",
      direction: "left",
    });

    // CTA — kcvv-black bg, no padding, no transition
    expect(sections[3].key).toBe("cta");
    expect(sections[3].bg).toBe("kcvv-black");
    expect(sections[3].paddingTop).toBe("pt-0");
    expect(sections[3].paddingBottom).toBe("pb-0");
    expect(sections[3].transition).toBeUndefined();
  });

  it("returns 3 sections when spotlight is false", () => {
    const sections = getSponsorsSections({
      header: <div data-testid="header" />,
      spotlight: false,
      grid: <div data-testid="grid" />,
      cta: <div data-testid="cta" />,
    });

    expect(sections).toHaveLength(3);
    expect(sections[0].key).toBe("header");
    expect(sections[1].key).toBe("grid");
    expect(sections[2].key).toBe("cta");
  });

  it("injects caller-provided content into the correct sections", () => {
    const header = <div data-testid="header-content" />;
    const spotlight = <div data-testid="spotlight-content" />;
    const grid = <div data-testid="grid-content" />;
    const cta = <div data-testid="cta-content" />;

    const sections = getSponsorsSections({ header, spotlight, grid, cta });

    expect(sections[0].content).toBe(header);
    expect(sections[1].content).toBe(spotlight);
    expect(sections[2].content).toBe(grid);
    expect(sections[3].content).toBe(cta);
  });
});

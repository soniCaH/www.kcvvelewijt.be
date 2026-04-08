import { describe, it, expect } from "vitest";
import { getPloegenSections } from "./getPloegenSections";

describe("getPloegenSections", () => {
  it("returns 4 sections when all content is provided", () => {
    const sections = getPloegenSections({
      hero: <div data-testid="hero" />,
      featured: <div data-testid="featured" />,
      youth: <div data-testid="youth" />,
      cta: <div data-testid="cta" />,
    });

    expect(sections).toHaveLength(4);

    // Hero — kcvv-black, diagonal right overlap full
    expect(sections[0].key).toBe("hero");
    expect(sections[0].bg).toBe("kcvv-black");
    expect(sections[0].paddingTop).toBe("pt-0");
    expect(sections[0].paddingBottom).toBe("pb-0");
    expect(sections[0].transition).toEqual({
      type: "diagonal",
      direction: "right",
      overlap: "full",
    });

    // Featured — gray-100, diagonal left
    expect(sections[1].key).toBe("featured");
    expect(sections[1].bg).toBe("gray-100");
    expect(sections[1].paddingTop).toBe("pt-20");
    expect(sections[1].paddingBottom).toBe("pb-20");
    expect(sections[1].transition).toEqual({
      type: "diagonal",
      direction: "left",
    });

    // Youth — kcvv-black, diagonal right
    expect(sections[2].key).toBe("youth");
    expect(sections[2].bg).toBe("kcvv-black");
    expect(sections[2].paddingTop).toBe("pt-20");
    expect(sections[2].paddingBottom).toBe("pb-20");
    expect(sections[2].transition).toEqual({
      type: "diagonal",
      direction: "right",
    });

    // CTA — gray-100, no transition
    expect(sections[3].key).toBe("cta");
    expect(sections[3].bg).toBe("gray-100");
    expect(sections[3].paddingTop).toBe("pt-16");
    expect(sections[3].paddingBottom).toBe("pb-16");
    expect(sections[3].transition).toBeUndefined();
  });

  it("injects caller-provided content into all sections", () => {
    const hero = <div data-testid="hero-content" />;
    const featured = <div data-testid="featured-content" />;
    const youth = <div data-testid="youth-content" />;
    const cta = <div data-testid="cta-content" />;

    const sections = getPloegenSections({ hero, featured, youth, cta });

    expect(sections[0].content).toBe(hero);
    expect(sections[1].content).toBe(featured);
    expect(sections[2].content).toBe(youth);
    expect(sections[3].content).toBe(cta);
  });

  it("omits hero section when hero content is undefined", () => {
    const sections = getPloegenSections({
      youth: <div data-testid="youth" />,
      cta: <div data-testid="cta" />,
    });

    expect(sections).toHaveLength(2);
    expect(sections[0].key).toBe("youth");
    expect(sections[1].key).toBe("cta");
  });

  it("omits featured section when featured content is undefined", () => {
    const sections = getPloegenSections({
      hero: <div data-testid="hero" />,
      youth: <div data-testid="youth" />,
      cta: <div data-testid="cta" />,
    });

    expect(sections).toHaveLength(3);
    expect(sections[0].key).toBe("hero");
    expect(sections[1].key).toBe("youth");
    expect(sections[2].key).toBe("cta");
  });
});

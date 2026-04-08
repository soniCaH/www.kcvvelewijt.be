import { describe, it, expect } from "vitest";
import { getJeugdSections } from "./getJeugdSections";

describe("getJeugdSections", () => {
  it("returns 5 sections with correct keys, backgrounds, and transitions", () => {
    const sections = getJeugdSections({
      editorial: <div data-testid="editorial" />,
      teams: <div data-testid="teams" />,
      quote: <div data-testid="quote" />,
      cta: <div data-testid="cta" />,
    });

    expect(sections).toHaveLength(5);

    // Hero — always static PageHero, kcvv-black bg, diagonal right overlap full
    expect(sections[0].key).toBe("hero");
    expect(sections[0].bg).toBe("kcvv-black");
    expect(sections[0].paddingTop).toBe("pt-0");
    expect(sections[0].paddingBottom).toBe("pb-0");
    expect(sections[0].transition).toEqual({
      type: "diagonal",
      direction: "right",
      overlap: "full",
    });

    // Editorial — gray-100, diagonal left
    expect(sections[1].key).toBe("editorial");
    expect(sections[1].bg).toBe("gray-100");
    expect(sections[1].paddingTop).toBe("pt-20");
    expect(sections[1].paddingBottom).toBe("pb-20");
    expect(sections[1].transition).toEqual({
      type: "diagonal",
      direction: "left",
    });

    // Teams — kcvv-black, diagonal right
    expect(sections[2].key).toBe("teams");
    expect(sections[2].bg).toBe("kcvv-black");
    expect(sections[2].paddingTop).toBe("pt-20");
    expect(sections[2].paddingBottom).toBe("pb-20");
    expect(sections[2].transition).toEqual({
      type: "diagonal",
      direction: "right",
    });

    // Quote — kcvv-green-dark, diagonal right
    expect(sections[3].key).toBe("quote");
    expect(sections[3].bg).toBe("kcvv-green-dark");
    expect(sections[3].paddingTop).toBe("pt-20");
    expect(sections[3].paddingBottom).toBe("pb-20");
    expect(sections[3].transition).toEqual({
      type: "diagonal",
      direction: "right",
    });

    // CTA — gray-100, no transition
    expect(sections[4].key).toBe("cta");
    expect(sections[4].bg).toBe("gray-100");
    expect(sections[4].paddingTop).toBe("pt-16");
    expect(sections[4].paddingBottom).toBe("pb-16");
    expect(sections[4].transition).toBeUndefined();
  });

  it("injects caller-provided content into editorial, teams, quote, and cta sections", () => {
    const editorial = <div data-testid="editorial-content" />;
    const teams = <div data-testid="teams-content" />;
    const quote = <div data-testid="quote-content" />;
    const cta = <div data-testid="cta-content" />;

    const sections = getJeugdSections({ editorial, teams, quote, cta });

    expect(sections[1].content).toBe(editorial);
    expect(sections[2].content).toBe(teams);
    expect(sections[3].content).toBe(quote);
    expect(sections[4].content).toBe(cta);
  });
});

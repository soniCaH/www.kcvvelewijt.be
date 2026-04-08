import { describe, it, expect } from "vitest";
import { getClubSections } from "./getClubSections";

describe("getClubSections", () => {
  it("returns 4 sections with correct keys, backgrounds, and transitions", () => {
    const sections = getClubSections({
      editorial: <div data-testid="editorial" />,
      mission: <div data-testid="mission" />,
      contact: <div data-testid="contact" />,
    });

    expect(sections).toHaveLength(4);

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

    // Editorial — gray-100, caller-provided content
    expect(sections[1].key).toBe("editorial");
    expect(sections[1].bg).toBe("gray-100");
    expect(sections[1].transition).toEqual({
      type: "diagonal",
      direction: "left",
    });

    // Mission — kcvv-green-dark, caller-provided content
    expect(sections[2].key).toBe("mission");
    expect(sections[2].bg).toBe("kcvv-green-dark");
    expect(sections[2].transition).toEqual({
      type: "diagonal",
      direction: "right",
    });

    // Contact — gray-100, no transition
    expect(sections[3].key).toBe("contact");
    expect(sections[3].bg).toBe("gray-100");
    expect(sections[3].transition).toBeUndefined();
  });

  it("injects caller-provided content into editorial, mission, and contact sections", () => {
    const editorial = <div data-testid="editorial-content" />;
    const mission = <div data-testid="mission-content" />;
    const contact = <div data-testid="contact-content" />;

    const sections = getClubSections({ editorial, mission, contact });

    expect(sections[1].content).toBe(editorial);
    expect(sections[2].content).toBe(mission);
    expect(sections[3].content).toBe(contact);
  });
});

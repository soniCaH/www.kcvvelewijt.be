import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubjectAvatar } from "./SubjectAvatar";

describe("<SubjectAvatar>", () => {
  describe("scale='row'", () => {
    it("always renders a monogram, even when a photo URL is supplied", () => {
      const { container } = render(
        <SubjectAvatar
          firstName="Wim"
          photoUrl="https://example.com/wim.jpg"
          scale="row"
        />,
      );
      const node = container.firstElementChild as HTMLElement;
      expect(node.getAttribute("data-round-avatar")).toBe("monogram");
      expect(node.getAttribute("data-size")).toBe("40");
    });

    it("derives the monogram from the first letter of firstName, uppercased", () => {
      const { container } = render(
        <SubjectAvatar firstName="anouk" scale="row" />,
      );
      expect(container.textContent).toBe("A");
    });

    it("sets the family's middot when firstName is empty (defensive fallback)", () => {
      const { container } = render(<SubjectAvatar firstName="" scale="row" />);
      expect(container.textContent).toBe("·");
    });

    it("is a 40px round avatar with the 2px ink ring and the family fill", () => {
      const { container } = render(
        <SubjectAvatar firstName="Anouk" scale="row" />,
      );
      const disc = container.firstElementChild as HTMLElement;
      expect(disc.className).toContain("h-10");
      expect(disc.className).toContain("w-10");
      expect(disc.className).toContain("border-2");
      expect(disc.className).toContain("border-ink");
      expect(disc.className).toContain("bg-cream-soft");
      expect(disc.firstElementChild?.className).toContain("text-jersey-deep");
    });
  });

  describe("scale='attribution'", () => {
    it("renders the photo path when a photoUrl is supplied", () => {
      const { container } = render(
        <SubjectAvatar
          firstName="Wim"
          photoUrl="https://example.com/wim.jpg"
          scale="attribution"
        />,
      );
      const node = container.firstElementChild as HTMLElement;
      expect(node.getAttribute("data-round-avatar")).toBe("photo");
      expect(node.getAttribute("data-size")).toBe("64");
      expect(node.querySelector("img")).toBeTruthy();
    });

    it("falls back to monogram when photoUrl is null", () => {
      const { container } = render(
        <SubjectAvatar firstName="Wim" photoUrl={null} scale="attribution" />,
      );
      expect(
        container.firstElementChild?.getAttribute("data-round-avatar"),
      ).toBe("monogram");
    });

    it("falls back to monogram when photoUrl is empty string", () => {
      const { container } = render(
        <SubjectAvatar firstName="Wim" photoUrl="" scale="attribution" />,
      );
      expect(
        container.firstElementChild?.getAttribute("data-round-avatar"),
      ).toBe("monogram");
    });

    it("falls back to monogram when photoUrl is whitespace-only", () => {
      // Defensive: a poorly-sanitised Sanity field shouldn't feed an
      // invalid <img src> — the component trims before length-checking.
      const { container } = render(
        <SubjectAvatar firstName="Wim" photoUrl="   " scale="attribution" />,
      );
      expect(
        container.firstElementChild?.getAttribute("data-round-avatar"),
      ).toBe("monogram");
    });
  });

  describe("scale='byline' (5.d-col, #1796)", () => {
    it("renders the monogram path — no photo, even when photoUrl is supplied", () => {
      // Mirror of the row-scale rule: byline is monogram-only at 24px
      // (a 24px photo crop is even less identifiable than 32px). The
      // `hasPhoto` guard restricts the photo path to `attribution`.
      const { container } = render(
        <SubjectAvatar
          firstName="Tom"
          photoUrl="https://example.com/tom.jpg"
          scale="byline"
        />,
      );
      const node = container.firstElementChild as HTMLElement;
      expect(node.getAttribute("data-round-avatar")).toBe("monogram");
      expect(node.getAttribute("data-size")).toBe("24");
      expect(node.querySelector("img")).toBeNull();
    });

    it("is a 24px round avatar with the 1px ink ring", () => {
      const { container } = render(
        <SubjectAvatar firstName="Tom" scale="byline" />,
      );
      const disc = container.firstElementChild as HTMLElement;
      expect(disc.className).toContain("h-6");
      expect(disc.className).toContain("w-6");
      expect(disc.className).toContain("border-ink");
      expect(disc.className).not.toContain("border-2");
    });

    it("derives the monogram from the first letter of firstName, uppercased", () => {
      const { container } = render(
        <SubjectAvatar firstName="tom" scale="byline" />,
      );
      expect(container.textContent).toBe("T");
    });

    it("gives the disc no accessible name — a monogram identifies nobody", () => {
      const { container } = render(
        <SubjectAvatar firstName="Tom" scale="byline" />,
      );
      const disc = container.firstElementChild as HTMLElement;
      expect(disc.getAttribute("aria-hidden")).toBe("true");
      expect(disc.getAttribute("aria-label")).toBeNull();
      expect(disc.getAttribute("role")).toBeNull();
    });
  });

  describe("initials (the family's one helper)", () => {
    it("keeps one letter for a first-name-only subject", () => {
      const { container } = render(
        <SubjectAvatar firstName="Wim" scale="attribution" />,
      );
      expect(container.textContent).toBe("W");
    });

    it("keeps one letter for a compound first name", () => {
      const { container } = render(
        <SubjectAvatar firstName="Mohamed Amine" scale="row" />,
      );
      expect(container.textContent).toBe("M");
      const attribution = render(
        <SubjectAvatar firstName=" jan willem " scale="attribution" />,
      );
      expect(attribution.container.textContent).toBe("J");
    });

    it("sets two letters when a full name is passed (the byline author)", () => {
      const { container } = render(
        <SubjectAvatar firstName="Tom Janssens" scale="byline" />,
      );
      expect(container.textContent).toBe("TJ");
    });
  });

  describe("accessibility", () => {
    // #2559 rule 4. The avatar sits beside the subject's own name in the
    // attribution row, so both paths are silent and there is no prop to name
    // them with.
    it("leaves the photo path silent", () => {
      const { container } = render(
        <SubjectAvatar
          firstName="Wim"
          photoUrl="https://example.com/wim.jpg"
          scale="attribution"
        />,
      );
      expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
    });

    it("leaves the monogram path silent", () => {
      const { container } = render(
        <SubjectAvatar firstName="Anouk" scale="row" />,
      );
      const disc = container.firstElementChild as HTMLElement;
      expect(disc.getAttribute("aria-hidden")).toBe("true");
      expect(disc.getAttribute("aria-label")).toBeNull();
      expect(disc.getAttribute("role")).toBeNull();
    });
  });
});

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
      expect(node.getAttribute("data-subject-avatar")).toBe("monogram");
      expect(node.getAttribute("data-scale")).toBe("row");
    });

    it("derives the monogram from the first letter of firstName, uppercased", () => {
      const { container } = render(
        <SubjectAvatar firstName="anouk" scale="row" />,
      );
      expect(container.textContent).toBe("A");
    });

    it("renders ? when firstName is empty (defensive fallback)", () => {
      const { container } = render(<SubjectAvatar firstName="" scale="row" />);
      expect(container.textContent).toBe("?");
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
      expect(node.getAttribute("data-subject-avatar")).toBe("photo");
      expect(node.getAttribute("data-scale")).toBe("attribution");
      expect(node.querySelector("img")).toBeTruthy();
    });

    it("falls back to monogram when photoUrl is null", () => {
      const { container } = render(
        <SubjectAvatar firstName="Wim" photoUrl={null} scale="attribution" />,
      );
      expect(
        container.firstElementChild?.getAttribute("data-subject-avatar"),
      ).toBe("monogram");
    });

    it("falls back to monogram when photoUrl is empty string", () => {
      const { container } = render(
        <SubjectAvatar firstName="Wim" photoUrl="" scale="attribution" />,
      );
      expect(
        container.firstElementChild?.getAttribute("data-subject-avatar"),
      ).toBe("monogram");
    });

    it("falls back to monogram when photoUrl is whitespace-only", () => {
      // Defensive: a poorly-sanitised Sanity field shouldn't feed an
      // invalid <img src> — the component trims before length-checking.
      const { container } = render(
        <SubjectAvatar firstName="Wim" photoUrl="   " scale="attribution" />,
      );
      expect(
        container.firstElementChild?.getAttribute("data-subject-avatar"),
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
      expect(node.getAttribute("data-subject-avatar")).toBe("monogram");
      expect(node.getAttribute("data-scale")).toBe("byline");
      expect(node.querySelector("img")).toBeNull();
    });

    it("applies the SCALE.byline tokens (h-6 w-6 + text-[12px])", () => {
      const { container } = render(
        <SubjectAvatar firstName="Tom" scale="byline" />,
      );
      const disc = container.firstElementChild as HTMLElement;
      // Box dimensions — 24px disc.
      expect(disc.className).toContain("h-6");
      expect(disc.className).toContain("w-6");
      // Inner monogram letter — 12px Freight Display italic black cream.
      const letter = disc.firstElementChild as HTMLElement;
      expect(letter.className).toContain("text-[12px]");
      expect(letter.className).toContain("font-display");
      expect(letter.className).toContain("italic");
      expect(letter.className).toContain("font-black");
      expect(letter.className).toContain("text-cream");
    });

    it("derives the monogram from the first letter of firstName, uppercased", () => {
      const { container } = render(
        <SubjectAvatar firstName="tom" scale="byline" />,
      );
      expect(container.textContent).toBe("T");
    });

    it("uses fullName for the disc's accessible name when supplied", () => {
      const { container } = render(
        <SubjectAvatar firstName="Tom" fullName="Tom De Smet" scale="byline" />,
      );
      const disc = container.firstElementChild as HTMLElement;
      expect(disc.getAttribute("aria-label")).toBe("Tom De Smet");
      expect(disc.getAttribute("role")).toBe("img");
    });
  });

  describe("accessibility", () => {
    it("uses fullName for the photo alt when supplied", () => {
      const { container } = render(
        <SubjectAvatar
          firstName="Wim"
          fullName="Wim Govaerts"
          photoUrl="https://example.com/wim.jpg"
          scale="attribution"
        />,
      );
      expect(container.querySelector("img")?.getAttribute("alt")).toBe(
        "Wim Govaerts",
      );
    });

    it("falls back to firstName for the photo alt when fullName omitted", () => {
      const { container } = render(
        <SubjectAvatar
          firstName="Wim"
          photoUrl="https://example.com/wim.jpg"
          scale="attribution"
        />,
      );
      expect(container.querySelector("img")?.getAttribute("alt")).toBe("Wim");
    });

    it("labels the monogram disc via aria-label so AT reads the subject name", () => {
      const { container } = render(
        <SubjectAvatar firstName="Anouk" fullName="Anouk De Wit" scale="row" />,
      );
      expect(container.firstElementChild?.getAttribute("aria-label")).toBe(
        "Anouk De Wit",
      );
      expect(container.firstElementChild?.getAttribute("role")).toBe("img");
    });
  });
});

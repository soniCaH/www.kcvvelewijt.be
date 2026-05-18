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

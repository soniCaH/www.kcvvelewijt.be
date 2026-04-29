import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DropCapParagraph } from "./DropCapParagraph";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DropCapParagraph", () => {
  it("default renders a <p>", () => {
    const { container } = render(
      <DropCapParagraph>Acht keer Elewijt.</DropCapParagraph>,
    );
    expect((container.firstChild as HTMLElement).tagName).toBe("P");
  });

  it("as='div' renders a <div>", () => {
    const { container } = render(
      <DropCapParagraph as="div">Hello.</DropCapParagraph>,
    );
    expect((container.firstChild as HTMLElement).tagName).toBe("DIV");
  });

  it("renders the full paragraph text (drop-cap is a CSS first-letter pseudo)", () => {
    const { container } = render(
      <DropCapParagraph>Acht keer Elewijt.</DropCapParagraph>,
    );
    // The native ::first-letter + initial-letter CSS styles the first
    // character; the DOM text is unmodified so screen readers pronounce
    // the full word correctly without aria-hidden + sr-only duplication.
    expect(container.textContent).toBe("Acht keer Elewijt.");
  });

  it("applies the initial-letter Tailwind modifier classes", () => {
    const { container } = render(
      <DropCapParagraph>Acht keer Elewijt.</DropCapParagraph>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("first-letter:[initial-letter:3]");
    expect(root.className).toContain("first-letter:[-webkit-initial-letter:3]");
  });

  it("default tone is jersey", () => {
    const { container } = render(<DropCapParagraph>Hello.</DropCapParagraph>);
    expect(container.firstChild).toHaveAttribute("data-tone", "jersey");
  });

  it("tone='ink' applies ink data-tone", () => {
    const { container } = render(
      <DropCapParagraph tone="ink">Hello.</DropCapParagraph>,
    );
    expect(container.firstChild).toHaveAttribute("data-tone", "ink");
  });

  it("warns in dev when children is empty", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<DropCapParagraph>{""}</DropCapParagraph>);
    expect(warn).toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("merges className", () => {
    const { container } = render(
      <DropCapParagraph className="custom-cap">Hi.</DropCapParagraph>,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      "custom-cap",
    );
  });
});

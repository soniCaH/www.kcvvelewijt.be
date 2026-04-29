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

  it("renders the first character inside an aria-hidden visual cap span", () => {
    const { container } = render(
      <DropCapParagraph>Acht keer Elewijt.</DropCapParagraph>,
    );
    const cap = container.querySelector('[data-drop-cap="true"]');
    expect(cap).not.toBeNull();
    expect(cap).toHaveAttribute("aria-hidden", "true");
    expect(cap!.textContent).toBe("A");
  });

  it("renders an sr-only duplicate of the first character for screen readers", () => {
    const { container } = render(
      <DropCapParagraph>Acht keer Elewijt.</DropCapParagraph>,
    );
    const srOnly = container.querySelector(".sr-only");
    expect(srOnly).not.toBeNull();
    expect(srOnly!.textContent).toBe("A");
  });

  it("renders the remainder of the paragraph after the cap", () => {
    const { container } = render(
      <DropCapParagraph>Acht keer Elewijt.</DropCapParagraph>,
    );
    expect(container.textContent).toContain("cht keer Elewijt.");
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
    const original = process.env.NODE_ENV;
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      configurable: true,
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<DropCapParagraph>{""}</DropCapParagraph>);
    expect(warn).toHaveBeenCalled();
    Object.defineProperty(process.env, "NODE_ENV", {
      value: original,
      configurable: true,
    });
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

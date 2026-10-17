import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PdfButton } from "./PdfButton";
import { CLUB_BOOK_PRINT_STYLE_ID } from "./print-style";

afterEach(() => {
  document.getElementById(CLUB_BOOK_PRINT_STYLE_ID)?.remove();
  delete (window as { print?: unknown }).print;
});

describe("<PdfButton>", () => {
  it("prints with an A4 portrait print sheet that only exists for that print", async () => {
    const print = vi.fn();
    (window as { print?: () => void }).print = print;
    render(<PdfButton />);

    // Nothing on the page until the visitor asks: another page's print is untouched.
    expect(document.getElementById(CLUB_BOOK_PRINT_STYLE_ID)).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "Download als PDF" }),
    );

    expect(print).toHaveBeenCalledOnce();
    const style = document.getElementById(CLUB_BOOK_PRINT_STYLE_ID);
    expect(style).toHaveProperty("media", "print");
    expect(style?.textContent).toContain("size: A4 portrait");
    expect(style?.textContent).not.toContain("scale(");

    window.dispatchEvent(new Event("afterprint"));
    expect(document.getElementById(CLUB_BOOK_PRINT_STYLE_ID)).toBeNull();
  });

  it("prints from the top of the page and puts the visitor back afterwards", async () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    onTestFinished(() => scrollTo.mockRestore());
    vi.spyOn(window, "scrollY", "get").mockReturnValue(1800);
    (window as { print?: () => void }).print = vi.fn();
    render(<PdfButton />);

    await userEvent.click(
      screen.getByRole("button", { name: "Download als PDF" }),
    );
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: "instant" });

    window.dispatchEvent(new Event("afterprint"));
    expect(scrollTo).toHaveBeenLastCalledWith({
      top: 1800,
      behavior: "instant",
    });
  });

  it("replaces a sheet left behind by a cancelled print instead of stacking another", async () => {
    (window as { print?: () => void }).print = vi.fn();
    render(<PdfButton />);
    const button = screen.getByRole("button", { name: "Download als PDF" });

    await userEvent.click(button);
    await userEvent.click(button);

    expect(
      document.querySelectorAll(`#${CLUB_BOOK_PRINT_STYLE_ID}`),
    ).toHaveLength(1);
  });
});

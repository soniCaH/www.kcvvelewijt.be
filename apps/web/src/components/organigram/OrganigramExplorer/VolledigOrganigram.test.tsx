/**
 * VolledigOrganigram unit tests — the full box-chart + A4 PDF (#2054).
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VolledigOrganigram } from "./VolledigOrganigram";
import { explorerFixture } from "./organigram-explorer.fixture";

afterEach(() => {
  document.getElementById("vo-print-style")?.remove();
  delete (window as { print?: unknown }).print;
});

describe("VolledigOrganigram", () => {
  it("renders the whole reporting tree from the root", () => {
    render(<VolledigOrganigram nodes={explorerFixture} />);
    const chart = screen.getByTestId("volledig-organigram");
    expect(chart).toHaveTextContent("KCVV Elewijt");
    expect(chart).toHaveTextContent("Voorzitter");
    expect(chart).toHaveTextContent("TVJO");
    expect(chart).toHaveTextContent("Lid Ethische Commissie"); // depth 5 leaf
  });

  it("marks vacant positions", () => {
    render(<VolledigOrganigram nodes={explorerFixture} />);
    const vacant = screen
      .getAllByText("vacature")
      .map((el) => el.closest("[data-state]"));
    expect(vacant.length).toBeGreaterThan(0);
    expect(vacant[0]).toHaveAttribute("data-state", "vacant");
  });

  it("triggers a print (PDF) and injects the A4 print stylesheet", async () => {
    const print = vi.fn();
    (window as { print?: () => void }).print = print;
    render(<VolledigOrganigram nodes={explorerFixture} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Download als PDF/ }),
    );

    expect(print).toHaveBeenCalledOnce();
    const style = document.getElementById("vo-print-style");
    expect(style).not.toBeNull();
    expect(style?.textContent).toContain("size: A4 landscape");
  });

  it("cleans up the injected print stylesheet after printing", async () => {
    (window as { print?: () => void }).print = vi.fn();
    render(<VolledigOrganigram nodes={explorerFixture} />);
    await userEvent.click(
      screen.getByRole("button", { name: /Download als PDF/ }),
    );
    // The afterprint listener removes the style; simulate the browser firing it.
    window.dispatchEvent(new Event("afterprint"));
    expect(document.getElementById("vo-print-style")).toBeNull();
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { HtmlTableBlock } from "./HtmlTableBlock";

const SIMPLE_TABLE_HTML = `
<table>
  <thead><tr><th>Datum</th><th>Tegenstander</th></tr></thead>
  <tbody>
    <tr><td>Za 12 jul</td><td>VK Veltem</td></tr>
    <tr><td>Za 19 jul</td><td>SK Berg</td></tr>
  </tbody>
</table>
`;

function mockScrollDimensions(scrollWidth: number, clientWidth: number) {
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    value: scrollWidth,
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    value: clientWidth,
  });
}

describe("<HtmlTableBlock>", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (HTMLElement.prototype as any).scrollWidth;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (HTMLElement.prototype as any).clientWidth;
  });

  it("returns null on whitespace-only html", () => {
    const { container } = render(<HtmlTableBlock html="   " />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null on empty html", () => {
    const { container } = render(<HtmlTableBlock html="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a table inside an accessible scrollable region", () => {
    render(<HtmlTableBlock html={SIMPLE_TABLE_HTML} />);
    const region = screen.getByRole("region");
    expect(region.getAttribute("aria-label")).toBe("Scrollable table");
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.querySelector("table")).toBeTruthy();
  });

  it("gives up its card chrome — no border, no shadow, no frame (#2582 rule 1)", () => {
    const { container } = render(<HtmlTableBlock html={SIMPLE_TABLE_HTML} />);
    const wrapper = container.querySelector("[data-html-table='true']");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.className).not.toContain("border-2");
    expect(wrapper?.className).not.toContain("border-ink");
    expect(wrapper?.className).not.toContain("shadow-paper-md");
  });

  it("renders the quiet skin — StandingsTable's register, not a jersey-deep header band", () => {
    render(<HtmlTableBlock html={SIMPLE_TABLE_HTML} />);
    const region = screen.getByRole("region");
    expect(region.className).toContain("border-b-2");
    expect(region.className).not.toContain("bg-jersey-deep");
    // The old zebra's actual value (a literal "zebra" class never existed).
    expect(region.className).not.toContain("rgba(0,0,0,0.025)");
  });

  it("does not anchor any column — an authored table simply scrolls (#2582 rule 3)", () => {
    // No scroll-dimension mock: HtmlTableBlock never passes
    // `overflowsClassName` at all, so "sticky" cannot appear regardless of
    // overflow state — this is a static check on the class string, not a
    // scroll-state one.
    render(<HtmlTableBlock html={SIMPLE_TABLE_HTML} />);
    const region = screen.getByRole("region");
    expect(region.className).not.toContain("sticky");
  });

  it("sanitizes the html (strips disallowed tags + attributes)", () => {
    const dirty = `
      <table>
        <thead><tr><th onclick="alert('x')">Datum</th></tr></thead>
        <tbody>
          <tr><td><script>alert('x')</script>Za 12 jul</td></tr>
        </tbody>
      </table>
    `;
    render(<HtmlTableBlock html={dirty} />);
    const region = screen.getByRole("region");
    expect(region.innerHTML).not.toContain("onclick");
    expect(region.innerHTML).not.toContain("<script");
  });

  it("renders <strong> inside a cell — the fixture calendar's side marker (#2481)", () => {
    const html = `
      <table>
        <tbody>
          <tr><td><strong>KCVV Elewijt A</strong></td><td>VK Veltem</td></tr>
        </tbody>
      </table>
    `;
    render(<HtmlTableBlock html={html} />);
    const region = screen.getByRole("region");
    const strong = region.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe("KCVV Elewijt A");
  });

  it("still strips <a> and every other unlisted tag — the allowlist gained exactly one entry (#2481)", () => {
    const html = `
      <table>
        <tbody>
          <tr><td><a href="/player/some-slug">Speler</a></td><td><em>Uit</em></td></tr>
        </tbody>
      </table>
    `;
    render(<HtmlTableBlock html={html} />);
    const region = screen.getByRole("region");
    expect(region.querySelector("a")).toBeNull();
    expect(region.querySelector("em")).toBeNull();
    expect(region.innerHTML).not.toContain("<a ");
    expect(region.innerHTML).not.toContain("<em>");
    expect(region.textContent).toContain("Speler");
    expect(region.textContent).toContain("Uit");
  });

  it("preserves colspan/rowspan/scope attributes", () => {
    const html = `
      <table>
        <thead><tr><th scope="col" colspan="2">Header</th></tr></thead>
        <tbody>
          <tr><td rowspan="2">A</td><td>B</td></tr>
          <tr><td>C</td></tr>
        </tbody>
      </table>
    `;
    render(<HtmlTableBlock html={html} />);
    const region = screen.getByRole("region");
    expect(region.querySelector("th")?.getAttribute("scope")).toBe("col");
    expect(region.querySelector("th")?.getAttribute("colspan")).toBe("2");
    expect(region.querySelector("td")?.getAttribute("rowspan")).toBe("2");
  });

  it("styles a <tfoot> row the same as tbody — every allowed row container, by construction (review M6)", () => {
    // The skin is applied via arbitrary-variant selectors on the wrapping
    // track (see HtmlTableBlock.tsx), not literal classes on the injected
    // HTML itself, so — same as StandingsTable's anchor tests — the track's
    // own className is what carries the selector, not the `<tfoot>`/`<td>`
    // elements it targets.
    const withFoot = `
      <table>
        <thead><tr><th>Datum</th></tr></thead>
        <tbody><tr><td>Za 12 jul</td></tr></tbody>
        <tfoot><tr><td>Totaal</td></tr></tfoot>
      </table>
    `;
    render(<HtmlTableBlock html={withFoot} />);
    const region = screen.getByRole("region");
    expect(region.className).toContain("[&_tfoot_tr]:border-b");
    expect(region.className).toContain("[&_td]:text-ink");
    expect(region.querySelector("tfoot td")).toBeTruthy();
  });

  it("renders nested tables without errors", () => {
    const nested = `
      <table>
        <thead><tr><th>Outer</th></tr></thead>
        <tbody>
          <tr><td>
            <table><tbody><tr><td>Inner</td></tr></tbody></table>
          </td></tr>
        </tbody>
      </table>`;
    render(<HtmlTableBlock html={nested} />);
    const tables = screen.getByRole("region").querySelectorAll("table");
    expect(tables.length).toBe(2);
  });

  describe("scroll arrow — control register, no reserved rail (#2444/#2476)", () => {
    it("mounts no right arrow and no fade when the table fits", () => {
      mockScrollDimensions(500, 500);
      render(<HtmlTableBlock html={SIMPLE_TABLE_HTML} />);

      expect(screen.queryByLabelText("Scroll right")).not.toBeInTheDocument();
    });

    it("mounts a control-register right arrow overlaying the edge on real overflow", () => {
      mockScrollDimensions(900, 500);
      render(<HtmlTableBlock html={SIMPLE_TABLE_HTML} />);

      const arrow = screen.getByLabelText("Scroll right");
      expect(arrow).toBeInTheDocument();
      expect(arrow).toHaveClass("bg-jersey-deep");
      expect(arrow).toHaveClass("h-8");
    });

    it("never reserves a rail — the scrollable region carries no rail padding", () => {
      mockScrollDimensions(900, 500);
      render(<HtmlTableBlock html={SIMPLE_TABLE_HTML} />);

      const region = screen.getByRole("region");
      expect(region.className).not.toContain("pl-10");
      expect(region.className).not.toContain("pr-10");
    });

    it("caps the fade at 24px when there is plenty of scroll left", () => {
      mockScrollDimensions(900, 500);
      const { container } = render(<HtmlTableBlock html={SIMPLE_TABLE_HTML} />);

      const fade = container.querySelector(
        '[aria-hidden="true"]',
      ) as HTMLElement;
      expect(fade.style.width).toBe("24px");
    });

    it("shrinks the fade below 24px as the end of the scroll nears", () => {
      mockScrollDimensions(900, 500);
      const { container } = render(<HtmlTableBlock html={SIMPLE_TABLE_HTML} />);

      const region = screen.getByRole("region");
      // 900 - 500 = 400 total overflow; scrolled to 385 leaves 15px — still
      // over the 10px dead-zone (so the arrow/fade stay mounted) but under
      // the 24px cap.
      Object.defineProperty(region, "scrollLeft", { value: 385 });
      act(() => {
        region.dispatchEvent(new Event("scroll"));
      });

      const fade = container.querySelector(
        '[aria-hidden="true"]',
      ) as HTMLElement;
      expect(fade.style.width).toBe("15px");
    });

    it("scrolls the region when the arrow is clicked", async () => {
      mockScrollDimensions(900, 500);
      const scrollToMock = vi.fn();
      Object.defineProperty(HTMLElement.prototype, "scrollTo", {
        configurable: true,
        value: scrollToMock,
      });
      render(<HtmlTableBlock html={SIMPLE_TABLE_HTML} />);

      const arrow = screen.getByLabelText("Scroll right");
      arrow.click();
      expect(scrollToMock).toHaveBeenCalled();
    });
  });
});

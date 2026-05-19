import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("<HtmlTableBlock>", () => {
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

  it("wraps the table inside a paper-card wrapper (border + shadow)", () => {
    const { container } = render(<HtmlTableBlock html={SIMPLE_TABLE_HTML} />);
    const wrapper = container.querySelector("[data-html-table='true']");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.className).toContain("border-2");
    expect(wrapper?.className).toContain("border-ink");
    expect(wrapper?.className).toContain("shadow-paper-md");
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
});

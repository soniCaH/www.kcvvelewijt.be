import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HtmlTableView } from "./HtmlTableView";

describe("<HtmlTableView>", () => {
  it("renders trustedHtml verbatim, without sanitizing (#3480)", () => {
    // `class` is stripped by HtmlTableBlock's sanitizer; surviving here
    // proves the view itself does no sanitizing.
    render(
      <HtmlTableView trustedHtml='<table><tbody><tr><td class="marker">€3</td></tr></tbody></table>' />,
    );
    const cell = screen.getByRole("region").querySelector("td.marker");
    expect(cell?.textContent).toBe("€3");
  });

  it("wraps the table in the scrollable region and forwards className", () => {
    const { container } = render(
      <HtmlTableView
        trustedHtml="<table><tbody><tr><td>x</td></tr></tbody></table>"
        className="mt-3!"
      />,
    );
    expect(container.querySelector("[data-html-table='true']")).toHaveClass(
      "mt-3!",
    );
    expect(screen.getByRole("region")).toHaveAccessibleName("Scrollable table");
  });
});

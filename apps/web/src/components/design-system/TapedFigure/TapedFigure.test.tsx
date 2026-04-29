import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TapedFigure } from "./TapedFigure";

const Img = (
  <img
    src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'/>"
    alt="t"
  />
);

describe("TapedFigure", () => {
  it("renders <figure>", () => {
    const { container } = render(<TapedFigure>{Img}</TapedFigure>);
    expect((container.firstChild as HTMLElement).tagName).toBe("FIGURE");
  });

  it("default aspect=landscape-16-9 sets aspect-ratio CSS", () => {
    const { container } = render(<TapedFigure>{Img}</TapedFigure>);
    const inner = container.querySelector("[data-aspect]") as HTMLElement;
    expect(inner).not.toBeNull();
    expect(inner.getAttribute("data-aspect")).toBe("landscape-16-9");
    expect(inner.style.aspectRatio).toBe("16 / 9");
  });

  it("aspect=square sets aspect-ratio 1 / 1", () => {
    const { container } = render(
      <TapedFigure aspect="square">{Img}</TapedFigure>,
    );
    const inner = container.querySelector("[data-aspect]") as HTMLElement;
    expect(inner.style.aspectRatio).toBe("1 / 1");
  });

  it("aspect=portrait-3-4 sets aspect-ratio 3 / 4", () => {
    const { container } = render(
      <TapedFigure aspect="portrait-3-4">{Img}</TapedFigure>,
    );
    const inner = container.querySelector("[data-aspect]") as HTMLElement;
    expect(inner.style.aspectRatio).toBe("3 / 4");
  });

  it("aspect=auto omits the aspect-ratio CSS", () => {
    const { container } = render(
      <TapedFigure aspect="auto">{Img}</TapedFigure>,
    );
    const inner = container.querySelector("[data-aspect]") as HTMLElement;
    expect(inner.style.aspectRatio).toBe("");
  });

  it("renders caption inside <figcaption> when caption prop is set", () => {
    render(<TapedFigure caption="Een mooie foto">{Img}</TapedFigure>);
    const cap = screen.getByText("Een mooie foto");
    expect(cap.closest("figcaption")).not.toBeNull();
  });

  it("renders credit inside the figcaption row when credit prop is set", () => {
    render(<TapedFigure credit="© KCVV">{Img}</TapedFigure>);
    const credit = screen.getByText("© KCVV");
    expect(credit.closest("figcaption")).not.toBeNull();
  });

  it("renders both caption and credit inside the same figcaption", () => {
    const { container } = render(
      <TapedFigure caption="Cap" credit="Cred">
        {Img}
      </TapedFigure>,
    );
    const figcaption = container.querySelector("figcaption");
    expect(figcaption).not.toBeNull();
    expect(figcaption!.textContent).toContain("Cap");
    expect(figcaption!.textContent).toContain("Cred");
  });

  it("does not render figcaption when neither caption nor credit is set", () => {
    const { container } = render(<TapedFigure>{Img}</TapedFigure>);
    expect(container.querySelector("figcaption")).toBeNull();
  });

  it("passes children (image element) into the aspect-ratio container", () => {
    render(<TapedFigure>{Img}</TapedFigure>);
    expect(screen.getByAltText("t")).toBeInTheDocument();
  });
});

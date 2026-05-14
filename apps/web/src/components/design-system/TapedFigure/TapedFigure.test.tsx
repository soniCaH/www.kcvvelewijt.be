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

  it("root carries .taped-figure class so global filter + grain rules apply", () => {
    const { container } = render(<TapedFigure>{Img}</TapedFigure>);
    const fig = container.firstChild as HTMLElement;
    expect(fig.className).toContain("taped-figure");
  });

  it("photo container carries .taped-figure__photo class", () => {
    const { container } = render(<TapedFigure>{Img}</TapedFigure>);
    const photo = container.querySelector(".taped-figure__photo");
    expect(photo).not.toBeNull();
  });

  it("defaults to data-tint=newsprint (filter applies via globals.css)", () => {
    const { container } = render(<TapedFigure>{Img}</TapedFigure>);
    const fig = container.firstChild as HTMLElement;
    expect(fig).toHaveAttribute("data-tint", "newsprint");
  });

  it('tint="none" emits data-tint=none for per-instance opt-out', () => {
    const { container } = render(<TapedFigure tint="none">{Img}</TapedFigure>);
    const fig = container.firstChild as HTMLElement;
    expect(fig).toHaveAttribute("data-tint", "none");
  });

  it("interactive=false (default) emits data-lift=false and no press hover classes", () => {
    const { container } = render(<TapedFigure>{Img}</TapedFigure>);
    const fig = container.firstChild as HTMLElement;
    expect(fig).toHaveAttribute("data-lift", "false");
    expect(fig.className).not.toMatch(/--card-press-x/);
  });

  it("interactive=true emits data-lift=true and wires press-mode hover on the card", () => {
    const { container } = render(<TapedFigure interactive>{Img}</TapedFigure>);
    const fig = container.firstChild as HTMLElement;
    expect(fig).toHaveAttribute("data-lift", "true");
    expect(fig).toHaveAttribute("data-interactive", "press");
    expect(fig.className).toMatch(/motion-safe:hover:\[--card-press-x:1px\]/);
  });

  it("renders the single tape strip when tape prop is set", () => {
    // Hard-capped at one strip per photo by design — the two-strip slot
    // cycle in the R9 first-pass lock was rejected at review.
    const { container } = render(
      <TapedFigure tape={{ color: "warm", length: "lg" }}>{Img}</TapedFigure>,
    );
    const tapes = container.querySelectorAll("[data-color]");
    expect(tapes).toHaveLength(1);
    expect(tapes[0]).toHaveAttribute("data-color", "warm");
  });
});

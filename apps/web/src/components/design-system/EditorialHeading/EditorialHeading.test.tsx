import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorialHeading } from "./EditorialHeading";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EditorialHeading", () => {
  it("renders the chosen heading level", () => {
    const { container } = render(
      <EditorialHeading level={1}>Hallo wereld</EditorialHeading>,
    );
    expect((container.firstChild as HTMLElement).tagName).toBe("H1");
  });

  it("level=6 renders <h6>", () => {
    const { container } = render(
      <EditorialHeading level={6}>x</EditorialHeading>,
    );
    expect((container.firstChild as HTMLElement).tagName).toBe("H6");
  });

  it("auto-appends a period when missing", () => {
    render(<EditorialHeading level={2}>Het rooster</EditorialHeading>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Het rooster.",
    );
  });

  it("does not double the period when already present", () => {
    render(<EditorialHeading level={2}>Klaar.</EditorialHeading>);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "Klaar.",
    );
  });

  it("default size is display-lg, applied as data-size", () => {
    const { container } = render(
      <EditorialHeading level={2}>x</EditorialHeading>,
    );
    expect(container.firstChild).toHaveAttribute("data-size", "display-lg");
  });

  it("respects size prop", () => {
    const { container } = render(
      <EditorialHeading level={2} size="display-2xl">
        x
      </EditorialHeading>,
    );
    expect(container.firstChild).toHaveAttribute("data-size", "display-2xl");
  });

  it("default tone is ink", () => {
    const { container } = render(
      <EditorialHeading level={2}>x</EditorialHeading>,
    );
    expect(container.firstChild).toHaveAttribute("data-tone", "ink");
  });

  it("respects tone prop", () => {
    const { container } = render(
      <EditorialHeading level={2} tone="jersey-deep">
        x
      </EditorialHeading>,
    );
    expect(container.firstChild).toHaveAttribute("data-tone", "jersey-deep");
  });

  it("emphasis wraps the matched substring in <em>", () => {
    const { container } = render(
      <EditorialHeading level={2} emphasis={{ text: "nieuws" }}>
        Het laatste nieuws
      </EditorialHeading>,
    );
    const em = container.querySelector("em");
    expect(em).not.toBeNull();
    expect(em!.textContent).toBe("nieuws");
  });

  it("emphasis with highlight wraps the <em> inside <HighlighterStroke>", () => {
    const { container } = render(
      <EditorialHeading
        level={2}
        emphasis={{ text: "nieuws", highlight: true }}
      >
        Het laatste nieuws
      </EditorialHeading>,
    );
    expect(container.querySelector("[data-highlighter-stroke]")).not.toBeNull();
    expect(container.querySelector("em")).not.toBeNull();
  });

  it("warns in dev when emphasis text is not found", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <EditorialHeading level={2} emphasis={{ text: "missing" }}>
        Het rooster
      </EditorialHeading>,
    );
    expect(warn).toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("merges className", () => {
    const { container } = render(
      <EditorialHeading level={2} className="custom-h">
        x
      </EditorialHeading>,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      "custom-h",
    );
  });
});

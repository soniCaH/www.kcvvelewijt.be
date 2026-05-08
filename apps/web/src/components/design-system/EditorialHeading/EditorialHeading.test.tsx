import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorialHeading } from "./EditorialHeading";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
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

  it("emphasis defaults to text-jersey-deep accent colour", () => {
    const { container } = render(
      <EditorialHeading level={2} emphasis={{ text: "nieuws" }}>
        Het laatste nieuws
      </EditorialHeading>,
    );
    const em = container.querySelector("em");
    expect(em?.className).toContain("text-jersey-deep");
    expect(em?.className).not.toContain("text-warm");
  });

  it("emphasis with tone='warm' applies text-warm, not text-jersey-deep", () => {
    const { container } = render(
      <EditorialHeading level={2} emphasis={{ text: "nieuws", tone: "warm" }}>
        Het laatste nieuws
      </EditorialHeading>,
    );
    const em = container.querySelector("em");
    expect(em?.className).toContain("text-warm");
    expect(em?.className).not.toContain("text-jersey-deep");
  });

  it("emphasis tone is ignored when highlight=true (HighlighterStroke owns colour)", () => {
    const { container } = render(
      <EditorialHeading
        level={2}
        emphasis={{ text: "nieuws", highlight: true, tone: "warm" }}
      >
        Het laatste nieuws
      </EditorialHeading>,
    );
    const em = container.querySelector("em");
    // No accent text-* utility on the em — HighlighterStroke wraps it.
    expect(em?.className).not.toContain("text-warm");
    expect(em?.className).not.toContain("text-jersey-deep");
    expect(container.querySelector("[data-highlighter-stroke]")).not.toBeNull();
  });

  it("Portable Text accent span defaults to text-jersey-deep", () => {
    const { container } = render(
      <EditorialHeading level={2}>
        {[
          {
            _type: "block",
            _key: "a",
            style: "normal",
            markDefs: [],
            children: [
              { _type: "span", _key: "a1", text: "De ", marks: [] },
              { _type: "span", _key: "a2", text: "kantine", marks: ["accent"] },
            ],
          },
        ]}
      </EditorialHeading>,
    );
    const em = container.querySelector("em");
    expect(em?.textContent).toBe("kantine.");
    expect(em?.className).toContain("text-jersey-deep");
  });

  it("Portable Text accent span honours accentTone='warm'", () => {
    const { container } = render(
      <EditorialHeading level={2} accentTone="warm">
        {[
          {
            _type: "block",
            _key: "b",
            style: "normal",
            markDefs: [],
            children: [
              { _type: "span", _key: "b1", text: "De ", marks: [] },
              {
                _type: "span",
                _key: "b2",
                text: "toekomst",
                marks: ["accent"],
              },
              { _type: "span", _key: "b3", text: " van Elewijt", marks: [] },
            ],
          },
        ]}
      </EditorialHeading>,
    );
    const em = container.querySelector("em");
    expect(em?.textContent).toBe("toekomst");
    expect(em?.className).toContain("text-warm");
    expect(em?.className).not.toContain("text-jersey-deep");
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

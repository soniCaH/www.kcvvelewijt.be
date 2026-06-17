import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShareFrame, ShareTop, ShareFoot } from "./ShareFrame";
import { Headline, Kicker, Scoreline, ShareName } from "./ShareElements";

/** Temporarily fake element width measurement (happy-dom has no layout). */
function withMeasuredWidths(
  clientWidth: number,
  scrollWidth: number,
  fn: () => void,
) {
  const proto = HTMLElement.prototype;
  const origClient = Object.getOwnPropertyDescriptor(proto, "clientWidth");
  const origScroll = Object.getOwnPropertyDescriptor(proto, "scrollWidth");
  Object.defineProperty(proto, "clientWidth", {
    configurable: true,
    get: () => clientWidth,
  });
  Object.defineProperty(proto, "scrollWidth", {
    configurable: true,
    get: () => scrollWidth,
  });
  try {
    fn();
  } finally {
    if (origClient) Object.defineProperty(proto, "clientWidth", origClient);
    else delete (proto as unknown as Record<string, unknown>).clientWidth;
    if (origScroll) Object.defineProperty(proto, "scrollWidth", origScroll);
    else delete (proto as unknown as Record<string, unknown>).scrollWidth;
  }
}

describe("ShareName auto-fit", () => {
  it("keeps long names on a single line (never wraps)", () => {
    render(
      <ShareFrame width={1080} height={1920} register="cream">
        <ShareName fontSize={185}>Amirgan Bouakhouf</ShareName>
      </ShareFrame>,
    );
    expect(screen.getByText("Amirgan Bouakhouf")).toHaveStyle({
      whiteSpace: "nowrap",
    });
  });

  it("scales a too-wide name down to fit its container", () => {
    withMeasuredWidths(920, 2000, () => {
      render(
        <ShareFrame width={1080} height={1920} register="cream">
          <ShareName fontSize={185}>Amirgan Bouakhouf</ShareName>
        </ShareFrame>,
      );
      // floor(185 * 920 / 2000) = 85, still >= minFontSize (56)
      expect(screen.getByText("Amirgan Bouakhouf")).toHaveStyle({
        fontSize: "85px",
      });
    });
  });

  it("does not scale a name that already fits", () => {
    withMeasuredWidths(920, 400, () => {
      render(
        <ShareFrame width={1080} height={1920} register="cream">
          <ShareName fontSize={185}>Mertens</ShareName>
        </ShareFrame>,
      );
      expect(screen.getByText("Mertens")).toHaveStyle({ fontSize: "185px" });
    });
  });

  it("keeps the base size when the DOM can't be measured (clientWidth 0)", () => {
    withMeasuredWidths(0, 2000, () => {
      render(
        <ShareFrame width={1080} height={1920} register="cream">
          <ShareName fontSize={185}>Amirgan Bouakhounov</ShareName>
        </ShareFrame>,
      );
      // available <= 0 → guard returns early → base size retained
      expect(screen.getByText("Amirgan Bouakhounov")).toHaveStyle({
        fontSize: "185px",
      });
    });
  });

  it("scores never wrap and scale down to fit", () => {
    withMeasuredWidths(920, 1380, () => {
      render(
        <ShareFrame width={1080} height={1920} register="cream">
          <Scoreline fontSize={460}>0 - 0</Scoreline>
        </ShareFrame>,
      );
      const score = screen.getByText("0–0");
      expect(score).toHaveStyle({ whiteSpace: "nowrap" });
      // floor(460 * 920 / 1380) = 306
      expect(score).toHaveStyle({ fontSize: "306px" });
    });
  });

  it("result headline scales down to fit and stays a heading", () => {
    withMeasuredWidths(920, 1200, () => {
      render(
        <ShareFrame width={1080} height={1920} register="dark">
          <Headline punctuation="bang" fontSize={170}>
            Gewonnen
          </Headline>
        </ShareFrame>,
      );
      const heading = screen.getByRole("heading", { name: /gewonnen/i });
      expect(heading.textContent).toBe("Gewonnen!");
      expect(heading).toHaveStyle({ whiteSpace: "nowrap" });
      // floor(170 * 920 / 1200) = 130
      expect(heading).toHaveStyle({ fontSize: "130px" });
    });
  });
});

describe("ShareFrame", () => {
  it("renders at the requested pixel dimensions", () => {
    const { container } = render(
      <ShareFrame width={1080} height={1920} register="cream">
        <span>content</span>
      </ShareFrame>,
    );
    expect(container.firstChild).toHaveStyle({
      width: "1080px",
      height: "1920px",
    });
  });

  it("renders a fullscreen image with crossOrigin for the image register", () => {
    render(
      <ShareFrame
        width={1080}
        height={1920}
        register="image"
        imageUrl="blob:abc"
      >
        <span>content</span>
      </ShareFrame>,
    );
    const img = document.querySelector('img[src="blob:abc"]');
    expect(img).toHaveAttribute("crossorigin", "anonymous");
  });

  it("exposes the palette to descendant elements via context", () => {
    render(
      <ShareFrame width={1080} height={1920} register="dark">
        <ShareTop />
        <Kicker>Doelpunt</Kicker>
        <Headline punctuation="bang" fontSize={84}>
          Goal
        </Headline>
        <ShareFoot left="KCVV — Eppegem" />
      </ShareFrame>,
    );
    // dark register → warm kicker + cream footer
    expect(screen.getByText("Doelpunt")).toHaveStyle({ color: "#f0c264" });
    expect(screen.getByText("KCVVELEWIJT.BE")).toHaveStyle({
      color: "#f5f1e6",
    });
    expect(screen.getByText("KCVVELEWIJT.BE")).toBeInTheDocument();
    expect(screen.getByText("KCVV — Eppegem")).toBeInTheDocument();
  });

  it("composes the headline accent word and punctuation into one accessible name", () => {
    render(
      <ShareFrame width={1080} height={1920} register="cream">
        <Headline punctuation="dot" fontSize={84}>
          Verloren
        </Headline>
      </ShareFrame>,
    );
    // adjacent <span> nodes put a space in the a11y name; the period is exact
    // in textContent (see reference_editorialheading_a11y_name_spacing).
    const heading = screen.getByRole("heading", { name: /Verloren/i });
    expect(heading.textContent).toBe("Verloren.");
  });
});

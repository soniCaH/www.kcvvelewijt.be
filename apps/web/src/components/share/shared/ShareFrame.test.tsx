import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShareFrame, ShareTop, ShareFoot } from "./ShareFrame";
import { Headline, Kicker } from "./ShareElements";

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

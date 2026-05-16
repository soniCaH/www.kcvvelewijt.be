import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { YouthSection } from "./YouthSection";
import { YouthBackdrop } from "./YouthBackdrop";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...rest }: ImageProps) => (
    <img alt={alt} src={typeof src === "string" ? src : ""} {...rest} />
  ),
}));

describe("YouthSection", () => {
  it("renders the meta label", () => {
    render(<YouthSection />);
    expect(screen.getByText("Word jeugdspeler")).toBeInTheDocument();
  });

  it("renders the editorial title", () => {
    render(<YouthSection />);
    expect(
      screen.getByRole("heading", { name: /de toekomst van elewijt/i }),
    ).toBeInTheDocument();
  });

  it("renders the lead copy", () => {
    render(<YouthSection />);
    expect(
      screen.getByText(/onze jeugdwerking groeit elk jaar/i),
    ).toBeInTheDocument();
  });

  it("renders the stats line", () => {
    render(<YouthSection />);
    expect(screen.getByText(/220\+ spelers · 16 ploegen/i)).toBeInTheDocument();
  });

  it("renders the primary CTA link to /jeugd", () => {
    render(<YouthSection />);
    const link = screen.getByRole("link", { name: /ontdek onze jeugd/i });
    expect(link).toHaveAttribute("href", "/jeugd");
  });

  it("renders the secondary CTA 'Schrijf je in' → /club/inschrijven (R5.B)", () => {
    render(<YouthSection />);
    const link = screen.getByRole("link", { name: /schrijf je in/i });
    expect(link).toHaveAttribute("href", "/club/inschrijven");
  });

  it("shifts heading emphasis to 'Elewijt' (R5.B brief §8)", () => {
    const { container } = render(<YouthSection />);
    const heading = container.querySelector("h2");
    // EditorialHeading wraps the accented substring in an <em>. The
    // emphasis lock is "Elewijt", not "De toekomst" — the previous
    // copy emphasized the abstract concept.
    const em = heading?.querySelector("em");
    expect(em).not.toBeNull();
    expect(em?.textContent?.trim()).toBe("Elewijt");
  });

  it("renders the top stripe band (StripedSeam xl cream-jersey-deep, R5.B)", () => {
    const { container } = render(<YouthSection />);
    const seam = container.querySelector("svg[data-color-pair]");
    expect(seam).not.toBeNull();
    // cream + jersey-deep — paper-tape on green, quieter than the
    // first-pass jersey-tonal-light pair.
    expect(seam).toHaveAttribute("data-color-pair", "cream-jersey-deep");
    expect(seam).toHaveAttribute("data-height", "xl");
  });

  it("does not wrap the stripe band with ink hairlines (consistency with ClubshopBanner)", () => {
    // The R5.B lock proposed 1px ink lines top + bottom around the
    // seam. PR review dropped them — the cream stripes carry the
    // band's edge against the photo backdrop without an extra frame,
    // and the Clubshop section ships its seams bare for the same
    // reason.
    const { container } = render(<YouthSection />);
    const seam = container.querySelector("svg[data-color-pair]");
    const wrapper = seam?.parentElement;
    expect(wrapper?.className).not.toMatch(/\bborder-t\b/);
    expect(wrapper?.className).not.toMatch(/\bborder-b\b/);
    expect(wrapper?.className).not.toMatch(/\bborder-ink\b/);
  });

  it("does not apply marginTop / paddingBottom positioning hacks (inline or pt-0/pb-0 classes)", () => {
    const { container } = render(<YouthSection />);
    const root = container.firstElementChild as HTMLElement | null;
    expect(root?.style.marginTop).toBe("");
    expect(root?.style.paddingBottom).toBe("");
    expect(root?.className).not.toContain("pt-0");
    expect(root?.className).not.toContain("pb-0");
  });
});

describe("YouthBackdrop", () => {
  it("renders the youth-trainers background image", () => {
    const { container } = render(<YouthBackdrop />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toContain("youth-trainers");
  });

  it("marks itself decorative for assistive tech", () => {
    const { container } = render(<YouthBackdrop />);
    const root = container.firstElementChild;
    expect(root?.getAttribute("aria-hidden")).toBe("true");
  });

  it("uses the jersey-deep gradient token, not legacy kcvv-green-dark classes", () => {
    const { container } = render(<YouthBackdrop />);
    expect(container.innerHTML).toContain("--gradient-jersey-deep-overlay");
    expect(container.innerHTML).not.toContain("kcvv-green-dark");
  });

  it("layers the halftone print texture on top of the gradient", () => {
    const { container } = render(<YouthBackdrop />);
    expect(container.innerHTML).toContain("--pattern-halftone-dots");
    expect(container.innerHTML).toContain("mix-blend-screen");
  });
});

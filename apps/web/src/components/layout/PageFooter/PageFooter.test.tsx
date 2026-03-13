import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageFooter } from "./PageFooter";

// Mock the SponsorsBlock server component
vi.mock("@/components/sponsors", () => ({
  SponsorsBlock: ({
    title,
    description,
  }: {
    title?: string;
    description?: string;
  }) => (
    <div data-testid="sponsors-block">
      <h3>{title || "Onze sponsors"}</h3>
      <p>
        {description ||
          "KCVV Elewijt wordt mede mogelijk gemaakt door onze trouwe sponsors."}
      </p>
      <a href="/sponsors">Alle sponsors &raquo;</a>
    </div>
  ),
}));

describe("PageFooter", () => {
  it("renders the footer", () => {
    const { container } = render(<PageFooter />);
    expect(container.querySelector("footer")).toBeInTheDocument();
  });

  it("renders the KCVV logo", () => {
    render(<PageFooter />);
    const logo = screen.getByRole("img", { name: /kcvv elewijt/i });
    expect(logo).toBeInTheDocument();
  });

  it("renders all 9 contact rows", () => {
    render(<PageFooter />);
    expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
    expect(screen.getByText("Voorzitter")).toBeInTheDocument();
    expect(screen.getByText("GC")).toBeInTheDocument();
    expect(screen.getByText("Algemeen contact")).toBeInTheDocument();
    expect(screen.getByText("Jeugdwerking")).toBeInTheDocument();
    expect(screen.getByText("Verhuur kantine")).toBeInTheDocument();
    expect(screen.getByText("Website")).toBeInTheDocument();
    expect(screen.getByText("Privacy & cookies")).toBeInTheDocument();
    expect(screen.getAllByText("Cookie-instellingen").length).toBeGreaterThan(
      0,
    );
  });

  it("renders cookie preferences button", () => {
    render(<PageFooter />);
    const btn = screen.getByRole("button", { name: /cookie-instellingen/i });
    expect(btn).toBeInTheDocument();
  });

  it("renders contact email links", () => {
    render(<PageFooter />);
    expect(screen.getByText("info@kcvvelewijt.be")).toHaveAttribute(
      "href",
      "mailto:info@kcvvelewijt.be",
    );
    expect(screen.getByText("jeugd@kcvvelewijt.be")).toHaveAttribute(
      "href",
      "mailto:jeugd@kcvvelewijt.be",
    );
  });

  it("renders social links via SocialLinks component", () => {
    render(<PageFooter />);
    expect(screen.getByLabelText("Facebook")).toBeInTheDocument();
    expect(screen.getByLabelText("Twitter")).toBeInTheDocument();
    expect(screen.getByLabelText("Instagram")).toBeInTheDocument();
  });

  it("renders sponsors section heading", () => {
    render(<PageFooter />);
    expect(screen.getByText("Onze sponsors")).toBeInTheDocument();
  });

  it("renders sponsors description", () => {
    render(<PageFooter />);
    expect(
      screen.getByText(
        "KCVV Elewijt wordt mede mogelijk gemaakt door onze trouwe sponsors.",
      ),
    ).toBeInTheDocument();
  });

  it("renders link to all sponsors page", () => {
    render(<PageFooter />);
    const link = screen.getByText(/Alle sponsors/i);
    expect(link).toHaveAttribute("href", "/sponsors");
  });

  it("renders bottom motto on desktop", () => {
    render(<PageFooter />);
    expect(
      screen.getByText("Er is maar één plezante compagnie"),
    ).toBeInTheDocument();
  });

  it("renders privacy link", () => {
    render(<PageFooter />);
    const privacyLink = screen.getByText("Privacyverklaring");
    expect(privacyLink).toHaveAttribute("href", "/privacy");
  });

  it("applies custom className", () => {
    const { container } = render(<PageFooter className="custom-footer" />);
    expect(container.querySelector("footer")).toHaveClass("custom-footer");
  });

  it("has correct background styling with SVG wave", () => {
    const { container } = render(<PageFooter />);
    const footer = container.querySelector("footer") as HTMLElement;
    // happy-dom v20.6+ parses background shorthand into longhands
    // Verify the style properties that survive parsing
    expect(footer.style.backgroundSize).toBe("100%");
    expect(footer.style.padding).toBe("75px 2rem 2rem");
  });

  it("renders address", () => {
    render(<PageFooter />);
    expect(
      screen.getByText("Driesstraat 30, 1982 Elewijt"),
    ).toBeInTheDocument();
  });

  it("renders voorzitter name", () => {
    render(<PageFooter />);
    expect(screen.getByText("Rudy Bautmans")).toBeInTheDocument();
  });

  it("renders GC contact", () => {
    render(<PageFooter />);
    expect(screen.getByText("John De Ron")).toBeInTheDocument();
  });

  it("renders website contact", () => {
    render(<PageFooter />);
    expect(screen.getByText("Kevin Van Ransbeeck")).toBeInTheDocument();
  });

  it("renders verhuur contact", () => {
    render(<PageFooter />);
    expect(screen.getByText("Ann Walgraef")).toBeInTheDocument();
  });
});

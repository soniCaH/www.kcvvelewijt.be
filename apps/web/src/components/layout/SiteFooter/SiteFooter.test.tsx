import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SiteFooter } from "./SiteFooter";

vi.mock("./CookiePreferencesButton", () => ({
  CookiePreferencesButton: () => (
    <button type="button">Cookie-instellingen</button>
  ),
}));

describe("SiteFooter", () => {
  it("renders a footer landmark", () => {
    const { container } = render(<SiteFooter />);
    expect(container.querySelector("footer")).toBeInTheDocument();
  });

  it("renders the wordmark with jersey-deep emphasis on 'Elewijt'", () => {
    render(<SiteFooter />);
    const wordmark = screen.getByRole("heading", { name: /KCVV Elewijt/i });
    const elewijt = within(wordmark).getByText("Elewijt");
    expect(elewijt.className).toMatch(/text-jersey-deep/);
  });

  it("renders the motto with jersey-deep emphasis on 'plezante'", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/Er is maar één/i)).toBeInTheDocument();
    const plezante = screen.getByText("plezante");
    expect(plezante.className).toMatch(/text-jersey-deep/);
  });

  it("renders three task-oriented column headings", () => {
    render(<SiteFooter />);
    expect(screen.getByText("Ontdek")).toBeInTheDocument();
    expect(screen.getByText("Aansluiten")).toBeInTheDocument();
    expect(screen.getByText("Bij de club")).toBeInTheDocument();
  });

  it("renders the Ontdek column with task-oriented links", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: "Nieuws" })).toHaveAttribute(
      "href",
      "/nieuws",
    );
    expect(screen.getByRole("link", { name: "Kalender" })).toHaveAttribute(
      "href",
      "/kalender",
    );
    expect(screen.getByRole("link", { name: "Evenementen" })).toHaveAttribute(
      "href",
      "/events",
    );
    expect(screen.getByRole("link", { name: "Onze ploegen" })).toHaveAttribute(
      "href",
      "/ploegen",
    );
    expect(screen.getByRole("link", { name: "Jeugdwerking" })).toHaveAttribute(
      "href",
      "/jeugd",
    );
  });

  it("renders the Aansluiten column with role-based items", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: "Als speler" })).toHaveAttribute(
      "href",
      "/club/inschrijven",
    );
    expect(
      screen.getByRole("link", { name: "Als vrijwilliger" }),
    ).toHaveAttribute("href", "/club/vrijwilliger");
    expect(screen.getByRole("link", { name: "Als sponsor" })).toHaveAttribute(
      "href",
      "/sponsors",
    );
  });

  it("renders the Bij de club column", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: "Geschiedenis" })).toHaveAttribute(
      "href",
      "/club/geschiedenis",
    );
    expect(screen.getByRole("link", { name: "Bestuur" })).toHaveAttribute(
      "href",
      "/club/bestuur",
    );
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/club/contact",
    );
    expect(
      screen.getByRole("link", { name: "Praktische info" }),
    ).toHaveAttribute("href", "/club");
  });

  it("renders copyright with founding year 1909 and current year", () => {
    render(<SiteFooter />);
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(
        new RegExp(`©\\s*1909.*${currentYear}.*KCVV.*ELEWIJT`, "i"),
      ),
    ).toBeInTheDocument();
  });

  it("renders the club address in the colofon", () => {
    render(<SiteFooter />);
    expect(
      screen.getByText(/Driesstraat\s*32.*1982\s*Elewijt/i),
    ).toBeInTheDocument();
  });

  it("renders privacy link in the bottom bar", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: /privacy/i })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  it("renders cookie preferences button", () => {
    render(<SiteFooter />);
    expect(
      screen.getByRole("button", { name: /cookie-instellingen/i }),
    ).toBeInTheDocument();
  });

  it("renders Facebook and Instagram social glyphs", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: /facebook/i })).toHaveAttribute(
      "href",
      "https://facebook.com/KCVVElewijt/",
    );
    expect(screen.getByRole("link", { name: /instagram/i })).toHaveAttribute(
      "href",
      "https://www.instagram.com/kcvve",
    );
  });

  it("does not render a webshop link in the footer", () => {
    render(<SiteFooter />);
    expect(
      screen.queryByRole("link", { name: /webshop/i }),
    ).not.toBeInTheDocument();
  });

  it("does not render a newsletter signup", () => {
    render(<SiteFooter />);
    expect(screen.queryByText(/nieuwsbrief/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /e-?mail/i }),
    ).not.toBeInTheDocument();
  });

  it("applies a custom className to the outermost element", () => {
    const { container } = render(<SiteFooter className="custom-footer" />);
    expect(container.firstElementChild).toHaveClass("custom-footer");
  });
});

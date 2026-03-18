import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageFooter } from "./PageFooter";

vi.mock("./CookiePreferencesButton", () => ({
  CookiePreferencesButton: () => (
    <button type="button">Cookie-instellingen</button>
  ),
}));

describe("PageFooter", () => {
  it("renders the footer", () => {
    const { container } = render(<PageFooter />);
    expect(container.querySelector("footer")).toBeInTheDocument();
  });

  it("renders KCVV logo", () => {
    render(<PageFooter />);
    const logo = screen.getByAltText(/KCVV/i);
    expect(logo).toBeInTheDocument();
  });

  it("renders club address", () => {
    render(<PageFooter />);
    expect(screen.getByText(/Driesstraat 32/)).toBeInTheDocument();
  });

  it("renders club email", () => {
    render(<PageFooter />);
    const emailLink = screen.getByRole("link", {
      name: /info@kcvvelewijt\.be/i,
    });
    expect(emailLink).toHaveAttribute("href", "mailto:info@kcvvelewijt.be");
  });

  it("renders Facebook link", () => {
    render(<PageFooter />);
    const fbLink = screen.getByRole("link", { name: /facebook/i });
    expect(fbLink).toHaveAttribute("href", "https://facebook.com/KCVVElewijt/");
  });

  it("renders Instagram link", () => {
    render(<PageFooter />);
    const igLink = screen.getByRole("link", { name: /instagram/i });
    expect(igLink).toHaveAttribute("href", "https://www.instagram.com/kcvve");
  });

  it("renders copyright text", () => {
    render(<PageFooter />);
    const year = new Date().getFullYear();
    expect(screen.getByText(`© ${year} K.C.V.V. Elewijt`)).toBeInTheDocument();
  });

  it("renders privacy policy link", () => {
    render(<PageFooter />);
    const privacyLink = screen.getByRole("link", { name: "Privacyverklaring" });
    expect(privacyLink).toHaveAttribute("href", "/privacy");
  });

  it("renders cookie preferences button", () => {
    render(<PageFooter />);
    const btn = screen.getByRole("button", { name: /cookie-instellingen/i });
    expect(btn).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<PageFooter className="custom-footer" />);
    expect(container.querySelector("footer")).toHaveClass("custom-footer");
  });

  it("renders navigation links", () => {
    render(<PageFooter />);
    expect(screen.getByRole("link", { name: "Nieuws" })).toHaveAttribute(
      "href",
      "/news",
    );
    expect(screen.getByRole("link", { name: "Kalender" })).toHaveAttribute(
      "href",
      "/calendar",
    );
    expect(screen.getByRole("link", { name: "Sponsors" })).toHaveAttribute(
      "href",
      "/sponsors",
    );
  });
});

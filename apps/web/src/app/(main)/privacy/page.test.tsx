/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "./page";

describe("PrivacyPage", () => {
  it("renders the PageHero with the Juridisch label and headline", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Juridisch")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /privacyverklaring/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the prose container inside the gray section", () => {
    const { container } = render(<PrivacyPage />);
    const prose = container.querySelector("article.prose");
    expect(prose).not.toBeNull();
    expect(prose).toHaveClass("max-w-2xl");
    expect(prose).toHaveClass("mx-auto");
  });

  it("displays all required legal sections", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { name: /contactgegevens/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /welke gegevens verzamelen we/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /waarvoor gebruiken we je gegevens/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /jouw rechten/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /cookiebeleid/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /beveiliging/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /hoe lang bewaren we je gegevens/i }),
    ).toBeInTheDocument();
  });

  it("displays contact information", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/KCVV Elewijt vzw/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Driesstraat 30, 1982 Elewijt/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("info@kcvvelewijt.be").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("kevin@kcvvelewijt.be")).toBeInTheDocument();
  });

  it("includes GDPR rights information", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/recht op inzage/i)).toBeInTheDocument();
    expect(screen.getByText(/recht op correctie/i)).toBeInTheDocument();
    expect(screen.getByText(/recht op verwijdering/i)).toBeInTheDocument();
    expect(screen.getByText(/recht op bezwaar/i)).toBeInTheDocument();
  });

  it("has working email links", () => {
    render(<PrivacyPage />);
    const emailLinks = screen.getAllByRole("link", {
      name: /info@kcvvelewijt\.be/i,
    });
    expect(emailLinks.length).toBeGreaterThan(0);
    expect(emailLinks[0]).toHaveAttribute("href", "mailto:info@kcvvelewijt.be");
  });

  it("links to the help page from the closing section", () => {
    render(<PrivacyPage />);
    const helpLink = screen.getByRole("link", { name: /hulppagina/i });
    expect(helpLink).toHaveAttribute("href", "/hulp");
  });

  it("mentions cookie types", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/noodzakelijke cookies/i)).toBeInTheDocument();
    expect(screen.getByText(/analytische cookies/i)).toBeInTheDocument();
  });

  it("mentions GDPR/AVG compliance", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/GDPR\/AVG/i)).toBeInTheDocument();
  });

  it("displays the last updated date", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByText(/laatst bijgewerkt:\s*februari 2026/i),
    ).toBeInTheDocument();
  });
});

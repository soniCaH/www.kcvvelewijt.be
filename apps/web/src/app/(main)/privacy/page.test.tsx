import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "./page";

describe("PrivacyPage (Phase 8 cream-minimal reskin)", () => {
  it("renders the jersey-deep mono kicker and the serif h1 title", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Juridisch")).toBeInTheDocument();
    // EditorialHeading splits the emphasis word into separate inline nodes
    // ("Privacy" + <em>verklaring</em> + styled period), so the accessible
    // name has inter-node spaces under happy-dom ("Privacy verklaring .").
    expect(
      screen.getByRole("heading", { name: /privacy\s*verklaring/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the mono last-updated line in the header", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByText(/laatst bijgewerkt · juni 2026/i),
    ).toBeInTheDocument();
  });

  it("renders the intro lead with the original privacy copy", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByText(
        /respecteert je privacy en behandelt je persoonsgegevens vertrouwelijk/i,
      ),
    ).toBeInTheDocument();
  });

  it("does not use the legacy gray prose treatment", () => {
    const { container } = render(<PrivacyPage />);
    expect(container.querySelector(".prose")).toBeNull();
    expect(container.querySelector(".prose-gray")).toBeNull();
  });

  it("places a dotted divider before each H2 section", () => {
    render(<PrivacyPage />);
    // 11 legal sections → one separator before each.
    expect(screen.getAllByRole("separator").length).toBeGreaterThanOrEqual(11);
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
      screen.getAllByText(/Driesstraat 32, 1982 Elewijt/i).length,
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

  it("displays the last updated date in the Wijzigingen section", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByText(/laatst bijgewerkt:\s*juni 2026/i),
    ).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContactCard } from "./ContactCard";

describe("ContactCard", () => {
  it("renders the person name (rhythm), role and tappable email/phone", () => {
    render(
      <ContactCard
        contact={{
          name: "Jan Willems",
          role: "Voorzitter",
          email: "vz@kcvvelewijt.be",
          phone: "+32 470 12 34 56",
        }}
      />,
    );
    // Name is rendered first-semibold + last-italic → two leaf text nodes.
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Willems")).toBeInTheDocument();
    expect(screen.getByText("Voorzitter")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /e-mail jan willems/i }),
    ).toHaveAttribute("href", "mailto:vz@kcvvelewijt.be");
    expect(
      screen.getByRole("link", { name: /bel jan willems/i }),
    ).toHaveAttribute("href", "tel:+32470123456");
  });

  it("fires onContactClick with the channel when email/phone is clicked", () => {
    const onContactClick = vi.fn();
    render(
      <ContactCard
        contact={{
          name: "Jan Willems",
          role: "Voorzitter",
          email: "vz@kcvvelewijt.be",
          phone: "+32 470 12 34 56",
        }}
        onContactClick={onContactClick}
      />,
    );
    fireEvent.click(screen.getByRole("link", { name: /e-mail/i }));
    expect(onContactClick).toHaveBeenCalledWith("email");
    fireEvent.click(screen.getByRole("link", { name: /bel/i }));
    expect(onContactClick).toHaveBeenCalledWith("phone");
  });

  it("renders a 'Toon in structuur' cross-link for a position contact and fires onShowInStructure", () => {
    const onShowInStructure = vi.fn();
    render(
      <ContactCard
        contact={{
          name: "Jan Willems",
          role: "Voorzitter",
          nodeId: "node-vz",
          organigramHref: "/hulp?member=node-vz#structuur",
        }}
        onShowInStructure={onShowInStructure}
      />,
    );
    const link = screen.getByRole("link", { name: /toon in structuur/i });
    expect(link).toHaveAttribute("href", "/hulp?member=node-vz#structuur");
    fireEvent.click(link);
    expect(onShowInStructure).toHaveBeenCalledTimes(1);
  });

  it("renders a plain 'Vind je ploeg' link for a team-role contact (no structuur intercept)", () => {
    const onShowInStructure = vi.fn();
    render(
      <ContactCard
        contact={{
          name: "Trainer van jouw ploeg",
          role: "Trainer van jouw ploeg",
          organigramHref: "/ploegen",
        }}
        onShowInStructure={onShowInStructure}
      />,
    );
    const link = screen.getByRole("link", { name: /vind je ploeg/i });
    expect(link).toHaveAttribute("href", "/ploegen");
    fireEvent.click(link);
    expect(onShowInStructure).not.toHaveBeenCalled();
  });

  it("hides the role line when role equals name (avoids duplication)", () => {
    render(
      <ContactCard
        contact={{
          name: "Trainer van jouw ploeg",
          role: "Trainer van jouw ploeg",
        }}
      />,
    );
    // "Trainer" appears once (the name lead), not twice.
    expect(screen.getAllByText("Trainer")).toHaveLength(1);
  });

  it("renders no contact action links when neither email nor phone is set", () => {
    render(
      <ContactCard contact={{ name: "Secretariaat", role: "Secretariaat" }} />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

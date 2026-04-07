import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContactCard } from "./ContactCard";

describe("ContactCard", () => {
  it("renders name, role, email and phone", () => {
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
    expect(screen.getByText("Jan Willems")).toBeInTheDocument();
    expect(screen.getByText("Voorzitter")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /vz@kcvvelewijt\.be/ }),
    ).toHaveAttribute("href", "mailto:vz@kcvvelewijt.be");
    expect(
      screen.getByRole("link", { name: /\+32 470 12 34 56/ }),
    ).toHaveAttribute("href", "tel:+32470123456");
  });

  it("fires onContactClick with the channel when an email/phone link is clicked", () => {
    const onContactClick = vi.fn();
    render(
      <ContactCard
        contact={{
          name: "Jan",
          role: "Voorzitter",
          email: "vz@kcvvelewijt.be",
          phone: "+32 470 12 34 56",
        }}
        onContactClick={onContactClick}
      />,
    );
    fireEvent.click(screen.getByRole("link", { name: /vz@kcvvelewijt\.be/ }));
    expect(onContactClick).toHaveBeenCalledWith("email");

    fireEvent.click(screen.getByRole("link", { name: /\+32 470 12 34 56/ }));
    expect(onContactClick).toHaveBeenCalledWith("phone");
  });

  it("renders the organigram link when organigramHref is set", () => {
    render(
      <ContactCard
        contact={{
          name: "Jan",
          role: "Voorzitter",
          organigramHref: "/club/organigram?node=node-vz",
        }}
      />,
    );
    const link = screen.getByRole("link", { name: /bekijk in organigram/i });
    expect(link).toHaveAttribute("href", "/club/organigram?node=node-vz");
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
    const matches = screen.getAllByText("Trainer van jouw ploeg");
    expect(matches).toHaveLength(1);
  });

  it("does not render contact links when neither email nor phone is set", () => {
    render(
      <ContactCard
        contact={{
          name: "Trainer van jouw ploeg",
          role: "Trainer van jouw ploeg",
        }}
      />,
    );
    expect(screen.queryByRole("link", { name: /@/ })).not.toBeInTheDocument();
  });
});

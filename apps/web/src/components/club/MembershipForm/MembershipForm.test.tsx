import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MembershipForm } from "./MembershipForm";

describe("MembershipForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the base fields", () => {
    render(<MembershipForm />);
    expect(screen.getByLabelText(/Voornaam/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Achternaam/)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/)).toBeInTheDocument();
  });

  it("reveals the medical-certificate checkbox only for player roles", () => {
    render(<MembershipForm />);
    expect(screen.queryByText(/medisch attest/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/inschrijven als/i), {
      target: { value: "speler" },
    });
    expect(screen.getByText(/medisch attest/i)).toBeInTheDocument();
  });

  it("reveals the parent-consent block for a minor birth date", () => {
    render(<MembershipForm />);
    expect(screen.queryByText(/Minderjarig/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Geboortedatum/), {
      target: { value: "2014-05-01" },
    });
    expect(screen.getByLabelText(/E-mail ouder\/voogd/i)).toBeInTheDocument();
    expect(screen.getByText(/geef toestemming/i)).toBeInTheDocument();
  });

  it("posts to /api/membership and shows a success message", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<MembershipForm defaultRole="vrijwilliger" />);
    fireEvent.change(screen.getByLabelText(/Voornaam/), {
      target: { value: "Jan" },
    });
    fireEvent.change(screen.getByLabelText(/Achternaam/), {
      target: { value: "Peeters" },
    });
    fireEvent.change(screen.getByLabelText(/Geboortedatum/), {
      target: { value: "1990-06-15" },
    });
    fireEvent.change(screen.getByLabelText(/Geslacht/), {
      target: { value: "m" },
    });
    fireEvent.change(screen.getByLabelText(/Gemeente/), {
      target: { value: "Elewijt" },
    });
    fireEvent.change(screen.getByLabelText(/^E-mail/), {
      target: { value: "jan@example.com" },
    });
    fireEvent.click(screen.getByLabelText(/privacyverklaring/i));
    fireEvent.submit(screen.getByText(/Inschrijven/).closest("form")!);

    await waitFor(() =>
      expect(
        screen.getByText(/Bedankt voor je inschrijving/i),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/membership",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

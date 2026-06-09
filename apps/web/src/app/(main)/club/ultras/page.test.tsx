import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import UltrasPage from "./page";

describe("/club/ultras page", () => {
  it("renders the terrace-poster hero", () => {
    render(<UltrasPage />);

    expect(
      screen.getByText(/Supporters · KCVV Ultra's 55/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /de luidste hoek/i }),
    ).toBeInTheDocument();
  });

  it("renders editorial sections below the hero", () => {
    render(<UltrasPage />);

    expect(screen.getByText("Wie zijn we")).toBeInTheDocument();
    expect(screen.getByText("Wat doen we")).toBeInTheDocument();
    expect(screen.getByText("Lid worden")).toBeInTheDocument();
  });

  it("renders the raffle callout stats", () => {
    render(<UltrasPage />);

    // Scope to the callout — "500"/"750" also appear in the body prose, so a
    // page-wide text match would be ambiguous.
    const callout = within(screen.getByTestId("raffle-callout"));
    expect(callout.getByText("500")).toBeInTheDocument();
    expect(callout.getByText("750")).toBeInTheDocument();
  });
});

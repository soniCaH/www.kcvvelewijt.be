import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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

    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("750")).toBeInTheDocument();
  });
});

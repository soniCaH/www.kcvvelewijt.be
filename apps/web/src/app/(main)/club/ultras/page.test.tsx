import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import UltrasPage from "./page";

describe("/club/ultras page", () => {
  it("renders PageHero with ultras content", () => {
    render(<UltrasPage />);

    expect(screen.getByText("Supporters")).toBeInTheDocument();
    expect(screen.getByText(/Ultra's/)).toBeInTheDocument();
  });

  it("renders editorial sections below the hero", () => {
    render(<UltrasPage />);

    expect(screen.getByText("Wie zijn we")).toBeInTheDocument();
    expect(screen.getByText("Wat doen we")).toBeInTheDocument();
    expect(screen.getByText("Lid worden")).toBeInTheDocument();
  });
});

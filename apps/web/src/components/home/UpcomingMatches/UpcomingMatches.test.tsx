import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpcomingMatches } from "./UpcomingMatches";
import {
  mockUpcomingFive,
  mockUpcomingThree,
  mockUpcomingTwelve,
} from "./UpcomingMatches.mocks";

describe("UpcomingMatches", () => {
  it("returns null when matches list is empty", () => {
    const { container } = render(<UpcomingMatches matches={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the first 5 rows collapsed when total > 5", () => {
    render(<UpcomingMatches matches={mockUpcomingTwelve} />);
    const rows = screen.getAllByRole("link", { name: /^(?!Volledige).*/i });
    expect(rows).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: /toon alle 12 wedstrijden/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/volledige kalender/i)).not.toBeInTheDocument();
  });

  it("hides the expand button when exactly 5 upcoming matches", () => {
    render(<UpcomingMatches matches={mockUpcomingFive} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/volledige kalender/i)).not.toBeInTheDocument();
  });

  it("hides the expand button when fewer than 5 upcoming matches", () => {
    render(<UpcomingMatches matches={mockUpcomingThree} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("expands to show all matches and reveals the /kalender link", async () => {
    const user = userEvent.setup();
    render(<UpcomingMatches matches={mockUpcomingTwelve} />);
    await user.click(
      screen.getByRole("button", { name: /toon alle 12 wedstrijden/i }),
    );
    const rows = screen.getAllByRole("link");
    // 12 row links + 1 /kalender link
    expect(rows).toHaveLength(13);
    expect(
      screen.getByRole("link", { name: /volledige kalender/i }),
    ).toHaveAttribute("href", "/kalender");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("links each row to /wedstrijd/{id}", () => {
    render(<UpcomingMatches matches={mockUpcomingThree} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(mockUpcomingThree.length);
    mockUpcomingThree.forEach((m, i) => {
      expect(links[i]).toHaveAttribute("href", `/wedstrijd/${m.id}`);
    });
  });

  it("renders THUIS badge when KCVV is the home team", () => {
    render(<UpcomingMatches matches={[mockUpcomingFive[0]!]} />);
    expect(screen.getByText("THUIS")).toBeInTheDocument();
    expect(screen.queryByText("UIT")).not.toBeInTheDocument();
  });

  it("renders UIT badge when KCVV is the away team", () => {
    render(<UpcomingMatches matches={[mockUpcomingFive[1]!]} />);
    expect(screen.getByText("UIT")).toBeInTheDocument();
    expect(screen.queryByText("THUIS")).not.toBeInTheDocument();
  });

  it("starts expanded when initialExpanded=true", () => {
    render(<UpcomingMatches matches={mockUpcomingTwelve} initialExpanded />);
    const rows = screen.getAllByRole("link", { name: /^(?!Volledige).*/i });
    expect(rows).toHaveLength(12);
    expect(
      screen.getByRole("link", { name: /volledige kalender/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

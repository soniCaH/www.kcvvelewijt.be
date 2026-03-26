import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the data layer
vi.mock("@/lib/effect/runtime", () => ({
  runPromise: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/repositories/team.repository", () => ({
  TeamRepository: {},
}));

describe("/teams page — canonical section flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders youth directory section with kcvv-black background", async () => {
    const TeamsPage = (await import("./page")).default;
    const jsx = await TeamsPage();
    const { container } = render(jsx);

    // YouthTeamsDirectory renders with heading "Onze jeugd"
    // The section wrapper should use bg-kcvv-black, not bg-kcvv-green-dark
    const blackSections = container.querySelectorAll(".bg-kcvv-black");
    expect(blackSections.length).toBeGreaterThanOrEqual(1);

    // No kcvv-green-dark sections on the teams page
    const greenDarkSections = container.querySelectorAll(".bg-kcvv-green-dark");
    expect(greenDarkSections.length).toBe(0);
  });

  it("renders CTA section", async () => {
    const TeamsPage = (await import("./page")).default;
    const jsx = await TeamsPage();
    render(jsx);

    expect(
      screen.getByRole("link", { name: /meer info/i }),
    ).toBeInTheDocument();
  });
});

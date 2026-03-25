import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the data layer
vi.mock("@/lib/effect/runtime", () => ({
  runPromise: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/effect/services/SanityService", () => ({
  SanityService: {},
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

    // Should NOT have kcvv-green-dark for youth directory
    // (only MissionBanner quote section should use kcvv-green-dark)
    const greenDarkSections = container.querySelectorAll(".bg-kcvv-green-dark");
    // One kcvv-green-dark section is expected: the MissionBanner quote section
    expect(greenDarkSections.length).toBe(2); // section wrapper + content wrapper
  });

  it("renders MissionBanner quote section", async () => {
    const TeamsPage = (await import("./page")).default;
    const jsx = await TeamsPage();
    render(jsx);

    // MissionBanner should be present with the default quote
    expect(screen.getByText(/Wij zijn KCVV Elewijt/i)).toBeInTheDocument();
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

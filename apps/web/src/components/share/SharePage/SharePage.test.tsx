import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock html-to-image — browser canvas API not available in happy-dom
vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,ABC"),
}));

import { SharePage } from "./SharePage";

describe("SharePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Download button", () => {
    render(<SharePage />);
    expect(
      screen.getByRole("button", { name: /download/i }),
    ).toBeInTheDocument();
  });

  it("renders the GoalKcvvTemplate with hardcoded player data", () => {
    render(<SharePage />);
    expect(screen.getByText(/goal/i)).toBeInTheDocument();
  });

  it("calls html-to-image toPng when Download is clicked", async () => {
    const { toPng } = await import("html-to-image");
    const user = userEvent.setup();

    render(<SharePage />);
    await user.click(screen.getByRole("button", { name: /download/i }));

    expect(toPng).toHaveBeenCalledTimes(1);
  });

  it("calls toPng with exactly 1080x1920 dimensions", async () => {
    const { toPng } = await import("html-to-image");
    const user = userEvent.setup();

    render(<SharePage />);
    await user.click(screen.getByRole("button", { name: /download/i }));

    expect(toPng).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ width: 1080, height: 1920 }),
    );
  });
});

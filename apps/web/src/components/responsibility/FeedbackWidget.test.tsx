import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackWidget } from "./FeedbackWidget";

vi.stubGlobal("fetch", vi.fn());

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("FeedbackWidget", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.mocked(fetch).mockReset();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);
  });

  it("renders question and vote buttons in default state", () => {
    render(
      <FeedbackWidget
        pathSlug="inschrijving-nieuw-lid"
        pathTitle="Inschrijving nieuw lid"
      />,
    );

    expect(screen.getByText("Was dit nuttig?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /👍/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /👎/i })).toBeInTheDocument();
  });

  it("shows voted state when localStorage flag exists", () => {
    localStorageMock.setItem("kcvv:feedback:inschrijving-nieuw-lid", "1");

    render(
      <FeedbackWidget
        pathSlug="inschrijving-nieuw-lid"
        pathTitle="Inschrijving nieuw lid"
      />,
    );

    expect(screen.getByText("Bedankt voor je feedback!")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /👍/i }),
    ).not.toBeInTheDocument();
  });

  it("transitions to voted state and fires fetch on vote", async () => {
    const user = userEvent.setup();

    render(<FeedbackWidget pathSlug="test-path" pathTitle="Test Path" />);

    await user.click(screen.getByRole("button", { name: /👍/i }));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "kcvv:feedback:test-path",
      "1",
    );

    expect(screen.getByText("Bedankt voor je feedback!")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathSlug: "test-path",
          pathTitle: "Test Path",
          vote: "up",
        }),
      });
    });
  });

  it("sends down vote correctly", async () => {
    const user = userEvent.setup();

    render(<FeedbackWidget pathSlug="test-path" pathTitle="Test Path" />);

    await user.click(screen.getByRole("button", { name: /👎/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathSlug: "test-path",
          pathTitle: "Test Path",
          vote: "down",
        }),
      });
    });
  });
});

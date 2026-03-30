import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CAPTURE_WIDTH, CAPTURE_HEIGHT } from "../constants";
import type { PlayerForShare, MatchOption } from "./SharePage";

// Mock html-to-image — browser canvas API not available in happy-dom
vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,ABC"),
}));

// Mock URL.createObjectURL / revokeObjectURL (not available in happy-dom)
const mockObjectUrl = "blob:http://localhost/fake-blob-url";
globalThis.URL.createObjectURL = vi.fn().mockReturnValue(mockObjectUrl);
globalThis.URL.revokeObjectURL = vi.fn();

// Mock fetch for data URL → blob conversion
const mockBlob = new Blob(["fake-png-data"], { type: "image/png" });
globalThis.fetch = vi.fn().mockResolvedValue({
  blob: () => Promise.resolve(mockBlob),
} as unknown as Response);

import { SharePage } from "./SharePage";

const PLAYERS: PlayerForShare[] = [
  {
    id: "p1",
    firstName: "Jan",
    lastName: "Janssen",
    number: 10,
    celebrationImageUrl: "https://cdn.example.com/jan.jpg",
  },
  {
    id: "p2",
    firstName: "Piet",
    lastName: "Pieters",
    number: 7,
  },
  {
    id: "p3",
    firstName: "Ali",
    lastName: "Zengin",
    number: 22,
  },
];

const MATCHES: MatchOption[] = [
  {
    id: 1001,
    label: "KCVV Elewijt - FC Opponent (A-Ploeg)",
    matchName: "KCVV Elewijt — FC Opponent",
  },
  {
    id: 1002,
    label: "FC Home - KCVV Elewijt (B-Ploeg)",
    matchName: "FC Home — KCVV Elewijt",
  },
];

describe("SharePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Existing Phase 1 tests (updated for Phase 4 generate flow) ──────────

  it("renders the Generate button", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    expect(
      screen.getByRole("button", { name: /genereer/i }),
    ).toBeInTheDocument();
  });

  it("calls html-to-image toPng when Generate is clicked", async () => {
    const { toPng } = await import("html-to-image");
    const user = userEvent.setup();

    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await user.click(screen.getByRole("button", { name: /genereer/i }));

    expect(toPng).toHaveBeenCalledTimes(1);
  });

  it("calls toPng with exactly 1080x1920 dimensions", async () => {
    const { toPng } = await import("html-to-image");
    const user = userEvent.setup();

    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await user.click(screen.getByRole("button", { name: /genereer/i }));

    expect(toPng).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT }),
    );
  });

  it("shows an error message and re-enables the button when toPng rejects", async () => {
    const { toPng } = await import("html-to-image");
    vi.mocked(toPng).mockRejectedValueOnce(new Error("CORS error"));
    const user = userEvent.setup();

    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await user.click(screen.getByRole("button", { name: /genereer/i }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /genereer/i }),
    ).not.toBeDisabled();
  });

  // ─── Phase 3: Template picker ─────────────────────────────────────────────

  it("renders 9 template picker buttons", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    // All 9 templates should be present as buttons
    const templateLabels = [
      /goal kcvv/i,
      /goal teg/i,
      /aftrap/i,
      /rust/i,
      /eindstand/i,
      /rode kaart kcvv/i,
      /rode kaart teg/i,
      /gele kaart kcvv/i,
      /gele kaart teg/i,
    ];
    for (const label of templateLabels) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("defaults to goal-kcvv template selected (aria-pressed=true)", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    const goalKcvvBtn = screen.getByRole("button", { name: /goal kcvv/i });
    expect(goalKcvvBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("switching template updates aria-pressed state", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    const kickoffBtn = screen.getByRole("button", { name: /aftrap/i });
    await user.click(kickoffBtn);

    expect(kickoffBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /goal kcvv/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  // ─── Phase 3: Dynamic fields ─────────────────────────────────────────────

  it("match name input is always visible", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    expect(screen.getByPlaceholderText(/KCVV Elewijt/i)).toBeInTheDocument();
  });

  it("score input is visible for goal-kcvv (default template)", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    expect(screen.getByPlaceholderText(/2 - 0/i)).toBeInTheDocument();
  });

  it("score input is NOT visible for kickoff template", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /aftrap/i }));

    expect(screen.queryByPlaceholderText(/2 - 0/i)).not.toBeInTheDocument();
  });

  it("score input is visible for halftime template", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /rust/i }));

    expect(screen.getByPlaceholderText(/2 - 0/i)).toBeInTheDocument();
  });

  it("minute input is visible for goal-kcvv", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    expect(screen.getByPlaceholderText(/45\+2/i)).toBeInTheDocument();
  });

  it("minute input is NOT visible for kickoff", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /aftrap/i }));

    expect(screen.queryByPlaceholderText(/45\+2/i)).not.toBeInTheDocument();
  });

  it("player search is visible for goal-kcvv (default template)", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    expect(screen.getByLabelText(/zoek speler/i)).toBeInTheDocument();
  });

  it("player search is NOT visible for goal-opponent template", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /goal teg/i }));

    expect(screen.queryByLabelText(/zoek speler/i)).not.toBeInTheDocument();
  });

  it("player search is NOT visible for kickoff template", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /aftrap/i }));

    expect(screen.queryByLabelText(/zoek speler/i)).not.toBeInTheDocument();
  });

  it("mood select is visible for full-time template only", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    // Not visible by default (goal-kcvv)
    expect(
      screen.queryByRole("combobox", { name: /resultaat/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /eindstand/i }));

    expect(
      screen.getByRole("combobox", { name: /resultaat/i }),
    ).toBeInTheDocument();
  });

  // ─── Phase 3: Session persistence ────────────────────────────────────────

  it("score persists when switching from goal-kcvv to halftime", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    const scoreInput = screen.getByPlaceholderText(/2 - 0/i);
    await user.clear(scoreInput);
    await user.type(scoreInput, "3 - 1");

    await user.click(screen.getByRole("button", { name: /rust/i }));

    expect(screen.getByPlaceholderText(/2 - 0/i)).toHaveValue("3 - 1");
  });

  it("match name persists when switching templates", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    const matchInput = screen.getByPlaceholderText(/KCVV Elewijt/i);
    await user.clear(matchInput);
    await user.type(matchInput, "KCVV Elewijt — Rapid Leest");

    await user.click(screen.getByRole("button", { name: /aftrap/i }));
    await user.click(screen.getByRole("button", { name: /rust/i }));

    expect(screen.getByPlaceholderText(/KCVV Elewijt/i)).toHaveValue(
      "KCVV Elewijt — Rapid Leest",
    );
  });

  // ─── Phase 3: Player search ───────────────────────────────────────────────

  it("shows all players initially", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    expect(screen.getByText(/Janssen/i)).toBeInTheDocument();
    expect(screen.getByText(/Pieters/i)).toBeInTheDocument();
    expect(screen.getByText(/Zengin/i)).toBeInTheDocument();
  });

  it("filters players by search term", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    const searchInput = screen.getByLabelText(/zoek speler/i);
    await user.type(searchInput, "jan");

    expect(screen.getByText(/Janssen/i)).toBeInTheDocument();
    expect(screen.queryByText(/Pieters/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Zengin/i)).not.toBeInTheDocument();
  });

  it("selecting a player marks it as aria-selected", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    const playerBtn = screen.getByRole("option", { name: /Janssen/i });
    await user.click(playerBtn);

    expect(playerBtn).toHaveAttribute("aria-selected", "true");
  });

  // ─── Phase 3: Match combo-box ──────────────────────────────────────────────

  it("match datalist contains the provided matches", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    const datalist = document.getElementById(
      "match-options",
    ) as HTMLDataListElement;
    expect(datalist).not.toBeNull();
    // datalist <option> elements aren't exposed as ARIA options in happy-dom;
    // query them directly via the DOM
    const options = datalist.querySelectorAll("option");
    expect(options).toHaveLength(2);
  });

  it("shows minute input for red-card-kcvv template", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /rode kaart kcvv/i }));

    expect(screen.getByPlaceholderText(/45\+2/i)).toBeInTheDocument();
  });

  it("shows player search for yellow-card-kcvv template", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /gele kaart kcvv/i }));

    expect(screen.getByLabelText(/zoek speler/i)).toBeInTheDocument();
  });

  it("does NOT show player search for yellow-card-opponent template", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /gele kaart teg/i }));

    expect(screen.queryByLabelText(/zoek speler/i)).not.toBeInTheDocument();
  });

  // ─── Phase 4: Image export and mobile UX ──────────────────────────────────

  it("renders a Generate button", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    expect(
      screen.getByRole("button", { name: /genereer/i }),
    ).toBeInTheDocument();
  });

  it("clicking Generate shows a preview image", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /genereer/i }));

    expect(screen.getByRole("img", { name: /preview/i })).toBeInTheDocument();
  });

  it("no Share or Download button visible before Generate", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    expect(
      screen.queryByRole("button", { name: /delen/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /download/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Download button after Generate when canShare is not supported", async () => {
    // Default: navigator.canShare is undefined → falls back to download
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /genereer/i }));

    expect(
      screen.getByRole("button", { name: /download/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /delen/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Share button after Generate when canShare supports files", async () => {
    const originalCanShare = navigator.canShare;
    Object.defineProperty(navigator, "canShare", {
      value: () => true,
      writable: true,
      configurable: true,
    });

    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /genereer/i }));

    expect(screen.getByRole("button", { name: /delen/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /download/i }),
    ).not.toBeInTheDocument();

    // Restore
    Object.defineProperty(navigator, "canShare", {
      value: originalCanShare,
      writable: true,
      configurable: true,
    });
  });

  it("Share button calls navigator.share with a PNG file", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const originalShare = navigator.share;
    const originalCanShare = navigator.canShare;
    Object.defineProperty(navigator, "canShare", {
      value: () => true,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /genereer/i }));
    await user.click(screen.getByRole("button", { name: /delen/i }));

    expect(mockShare).toHaveBeenCalledTimes(1);
    const { files } = mockShare.mock.calls[0][0] as { files: File[] };
    expect(files).toHaveLength(1);
    expect(files[0]).toBeInstanceOf(File);
    expect(files[0].type).toBe("image/png");
    expect(files[0].name).toMatch(/^kcvv-.*\.png$/);

    // Restore
    Object.defineProperty(navigator, "share", {
      value: originalShare,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "canShare", {
      value: originalCanShare,
      writable: true,
      configurable: true,
    });
  });

  it("Download button triggers file download via anchor click", async () => {
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: clickSpy });
      }
      return el;
    });

    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /genereer/i }));
    await user.click(screen.getByRole("button", { name: /download/i }));

    expect(clickSpy).toHaveBeenCalledTimes(1);

    vi.mocked(document.createElement).mockRestore();
  });

  it("generated PNG uses 1080x1920 dimensions (pixelRatio 1)", async () => {
    const { toPng } = await import("html-to-image");
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /genereer/i }));

    expect(toPng).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        width: CAPTURE_WIDTH,
        height: CAPTURE_HEIGHT,
        pixelRatio: 1,
      }),
    );
  });
});

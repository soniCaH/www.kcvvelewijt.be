import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CAPTURE_WIDTH, CAPTURE_HEIGHT } from "../constants";
import type { PlayerForShare, MatchOption } from "./SharePage";

// Mock html-to-image — browser canvas API not available in happy-dom
vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,ABC"),
}));

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

  // ─── Existing Phase 1 tests (updated to pass props) ──────────────────────

  it("renders the Download button", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    expect(
      screen.getByRole("button", { name: /download/i }),
    ).toBeInTheDocument();
  });

  it("calls html-to-image toPng when Download is clicked", async () => {
    const { toPng } = await import("html-to-image");
    const user = userEvent.setup();

    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await user.click(screen.getByRole("button", { name: /download/i }));

    expect(toPng).toHaveBeenCalledTimes(1);
  });

  it("calls toPng with exactly 1080x1920 dimensions", async () => {
    const { toPng } = await import("html-to-image");
    const user = userEvent.setup();

    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await user.click(screen.getByRole("button", { name: /download/i }));

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
    await user.click(screen.getByRole("button", { name: /download/i }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download/i }),
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
});

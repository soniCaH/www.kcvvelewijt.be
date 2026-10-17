import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CAPTURE_WIDTH, CAPTURE_HEIGHT, SQUARE_SIZE } from "../constants";
import type { PlayerForShare, MatchOption } from "./SharePage";
import type { ShareItem } from "../looks/share-content";
import { clubToday } from "@/lib/utils/dates";

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

/** Today's templates are look W; a fresh phone starts on A Kaart (#3536). */
const pickW = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "W · Wedstrijd" }));

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
    kcvvTeamLabel: "A-Ploeg",
  },
  {
    id: 1002,
    label: "FC Home - KCVV Elewijt (B-Ploeg)",
    matchName: "FC Home — KCVV Elewijt",
    kcvvTeamLabel: "B-Ploeg",
  },
];

// Two squads meeting the same opponent (or two pitch-reservation placeholders)
// share an identical matchName — the datalist label is the only unique field.
const COLLIDING_MATCHES: MatchOption[] = [
  {
    id: 3001,
    label: "KCVV Elewijt - KCVV Elewijt (A-Ploeg)",
    matchName: "KCVV Elewijt — KCVV Elewijt",
    kcvvTeamLabel: "A-Ploeg",
    dateTime: "Zaterdag · 14:00",
  },
  {
    id: 3002,
    label: "KCVV Elewijt - KCVV Elewijt (U15)",
    matchName: "KCVV Elewijt — KCVV Elewijt",
    kcvvTeamLabel: "U15",
    dateTime: "Zaterdag · 16:00",
  },
];

describe("SharePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The story session (#3536) lives in localStorage: every test starts on a fresh phone.
    localStorage.clear();
  });

  // ─── Existing Phase 1 tests (updated for Phase 4 generate flow) ──────────

  it("renders the Generate button", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    expect(
      screen.getByRole("button", { name: /genereer/i }),
    ).toBeInTheDocument();
  });

  // Two calls: iOS Safari drops nested images on the first rasterization, so
  // the capture is warmed up once and only the second result is kept.
  it("calls html-to-image toPng twice when Generate is clicked", async () => {
    const { toPng } = await import("html-to-image");
    const user = userEvent.setup();

    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await user.click(screen.getByRole("button", { name: /genereer/i }));

    expect(toPng).toHaveBeenCalledTimes(2);
  });

  it("calls toPng with exactly 1080x1920 dimensions and pixelRatio 1", async () => {
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

  // Regression: without this, html-to-image keys its resource cache on the URL
  // minus the query string, so every `/_next/image?url=…` shares one entry and
  // later captures reuse the first image fetched (wrong player photo / crest).
  it("captures with includeQueryParams so per-image cache keys stay distinct", async () => {
    const { toPng } = await import("html-to-image");
    const user = userEvent.setup();

    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await user.click(screen.getByRole("button", { name: /genereer/i }));

    expect(toPng).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ includeQueryParams: true }),
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

  describe("generate failure (#2818)", () => {
    it("shows the locked notice through <EmptyState>, logs the caught error to the console only, and never leaks its message into the DOM", async () => {
      const { toPng } = await import("html-to-image");
      const generateError = new Error("CORS error");
      vi.mocked(toPng).mockRejectedValueOnce(generateError);
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const user = userEvent.setup();

      try {
        render(<SharePage matches={MATCHES} players={PLAYERS} />);
        await user.click(screen.getByRole("button", { name: /genereer/i }));

        // The accented substring splits the sentence across DOM nodes, so
        // assert on the notice's own alert region's full text content, the
        // same pattern #2580's CalendarSubscribePanel/MembershipForm tests
        // use.
        const notice = await screen.findByRole("alert");
        expect(notice).toHaveTextContent(
          "Exporteren mislukt. Probeer opnieuw.",
        );
        // The visitor never sees the caught error's own text — it must not
        // be fed to `<EmptyState>` from `err.message` (#2818).
        expect(screen.queryByText("CORS error")).not.toBeInTheDocument();
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining("generate"),
          generateError,
        );
      } finally {
        consoleError.mockRestore();
      }
    });

    it("no longer renders the pre-#2580 bespoke alert paragraph", async () => {
      const { toPng } = await import("html-to-image");
      vi.mocked(toPng).mockRejectedValueOnce(new Error("CORS error"));
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const user = userEvent.setup();

      try {
        render(<SharePage matches={MATCHES} players={PLAYERS} />);
        await user.click(screen.getByRole("button", { name: /genereer/i }));

        const notice = await screen.findByRole("alert");
        // The retired idiom carried `text-card-red` (a bespoke bare-paragraph
        // alert). `<EmptyState tier="slot" reason="unavailable">`'s own frame
        // carries `border-dashed` instead — see EmptyState.tsx's
        // `SlotNoticeEmptyState`.
        expect(notice.className).not.toContain("text-card-red");
        expect(notice.className).toContain("border-dashed");
      } finally {
        consoleError.mockRestore();
      }
    });
  });

  // ─── Phase 3: Template picker ─────────────────────────────────────────────

  it("W renders its 9 story template buttons; A–E offer all 11 moments", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    expect(
      screen.getByRole("button", { name: "Eindstand 1:1" }),
    ).toBeInTheDocument();
    await pickW(user);
    expect(screen.queryByRole("button", { name: "Eindstand 1:1" })).toBeNull();
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

    await user.click(screen.getByRole("button", { name: "Eindstand" }));

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

    try {
      const user = userEvent.setup();
      render(<SharePage matches={MATCHES} players={PLAYERS} />);

      await user.click(screen.getByRole("button", { name: /genereer/i }));

      expect(
        screen.getByRole("button", { name: /delen/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /download/i }),
      ).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(navigator, "canShare", {
        value: originalCanShare,
        writable: true,
        configurable: true,
      });
    }
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

    try {
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
    } finally {
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
    }
  });

  describe("share failure (#2818)", () => {
    it("shows the locked notice through <EmptyState>, logs the caught error to the console only, and never leaks its message into the DOM", async () => {
      const shareError = new Error("Permission denied");
      const mockShare = vi.fn().mockRejectedValue(shareError);
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
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        const user = userEvent.setup();
        render(<SharePage matches={MATCHES} players={PLAYERS} />);

        await user.click(screen.getByRole("button", { name: /genereer/i }));
        await user.click(screen.getByRole("button", { name: /delen/i }));

        const notice = await screen.findByRole("alert");
        expect(notice).toHaveTextContent("Delen mislukt. Probeer opnieuw.");
        expect(screen.queryByText("Permission denied")).not.toBeInTheDocument();
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining("share"),
          shareError,
        );
      } finally {
        consoleError.mockRestore();
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
      }
    });

    it("clears the failure notice after a subsequent successful share (#2818 review finding 1)", async () => {
      const mockShare = vi
        .fn()
        .mockRejectedValueOnce(new Error("Permission denied"))
        .mockResolvedValueOnce(undefined);
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
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        const user = userEvent.setup();
        render(<SharePage matches={MATCHES} players={PLAYERS} />);

        await user.click(screen.getByRole("button", { name: /genereer/i }));
        const shareButton = screen.getByRole("button", { name: /delen/i });
        await user.click(shareButton);
        await screen.findByRole("alert");

        await user.click(shareButton);

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      } finally {
        consoleError.mockRestore();
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
      }
    });

    it("clears the failure notice, along with the Delen button it described, when the form changes (#2818 review finding 1)", async () => {
      const mockShare = vi
        .fn()
        .mockRejectedValue(new Error("Permission denied"));
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
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        const user = userEvent.setup();
        render(<SharePage matches={MATCHES} players={PLAYERS} />);

        await user.click(screen.getByRole("button", { name: /genereer/i }));
        await user.click(screen.getByRole("button", { name: /delen/i }));
        await screen.findByRole("alert");

        // Any field change drops the stale preview/blob via `clearPreview`,
        // which unmounts the Delen button — the notice must not outlive it.
        // `getByLabelText` matches both the input and its labelled `<section>`
        // here, so target the match input by its placeholder instead.
        await user.type(
          screen.getByPlaceholderText("KCVV Elewijt — FC Tegenstander"),
          "x",
        );

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /delen/i }),
        ).not.toBeInTheDocument();
      } finally {
        consoleError.mockRestore();
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
      }
    });
  });

  it("does not show an error when share is cancelled (AbortError)", async () => {
    const abortError = new Error("Share cancelled");
    abortError.name = "AbortError";
    const mockShare = vi.fn().mockRejectedValue(abortError);
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

    try {
      const user = userEvent.setup();
      render(<SharePage matches={MATCHES} players={PLAYERS} />);

      await user.click(screen.getByRole("button", { name: /genereer/i }));
      await user.click(screen.getByRole("button", { name: /delen/i }));

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    } finally {
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
    }
  });

  it("revokes previous object URL when generating a new preview", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /genereer/i }));
    const firstUrl = vi.mocked(globalThis.URL.createObjectURL).mock.results[0]
      ?.value as string;

    await user.click(screen.getByRole("button", { name: /genereer/i }));

    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(firstUrl);
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

  it("ignores a second Generate click while the first is still in progress", async () => {
    const { toPng } = await import("html-to-image");
    let resolveToPng!: (value: string) => void;
    vi.mocked(toPng).mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          resolveToPng = resolve;
        }),
    );

    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    const btn = screen.getByRole("button", { name: /genereer/i });
    // First click starts generation
    await user.click(btn);
    // Second click should be ignored by the ref guard
    await user.click(btn);

    expect(toPng).toHaveBeenCalledTimes(1);

    // Resolve to let the component settle
    resolveToPng("data:image/png;base64,ABC");
  });

  // ─── Aspect toggle (Story / Square) ───────────────────────────────────────

  it("defaults to the Story aspect with 9 story templates", () => {
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    expect(
      screen.getByRole("button", { name: /story · 9:16/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /goal kcvv/i }),
    ).toBeInTheDocument();
  });

  it("in W, switching to Square shows only the two square templates", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await pickW(user);

    await user.click(screen.getByRole("button", { name: /vierkant · 1:1/i }));

    expect(
      screen.getByRole("button", { name: /pre-game/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /goal kcvv/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /rust/i }),
    ).not.toBeInTheDocument();
  });

  it("captures the square at 1080x1080 in Square aspect", async () => {
    const { toPng } = await import("html-to-image");
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /vierkant · 1:1/i }));
    await user.click(screen.getByRole("button", { name: /genereer/i }));

    expect(toPng).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        pixelRatio: 1,
      }),
    );
  });

  // ─── Competition + photo upload ───────────────────────────────────────────

  it("shows the competition field for eindstand but not goal-kcvv", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    expect(
      screen.queryByPlaceholderText(/2e provinciale/i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Eindstand" }));

    expect(screen.getByPlaceholderText(/2e provinciale/i)).toBeInTheDocument();
  });

  it("A–E have a photo slot on every template; W only on its image-capable ones", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /goal teg/i }));
    expect(screen.getByLabelText(/foto uploaden/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /goal kcvv/i }));
    await pickW(user);

    // goal-kcvv is image-capable
    expect(screen.getByLabelText(/foto uploaden/i)).toBeInTheDocument();

    // goal-opponent is not
    await user.click(screen.getByRole("button", { name: /goal teg/i }));
    expect(screen.queryByLabelText(/foto uploaden/i)).not.toBeInTheDocument();
  });

  it("creates an object URL when a photo is uploaded", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    const file = new File(["x"], "goal.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/foto uploaden/i), file);

    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(
      screen.getByRole("button", { name: /foto verwijderen/i }),
    ).toBeInTheDocument();
  });

  // ─── No-op guards (re-selecting the active aspect / template) ──────────────

  it("re-clicking the active Story aspect is a no-op (state stable)", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    const storyToggle = screen.getByRole("button", { name: /story · 9:16/i });
    await user.click(storyToggle);

    expect(storyToggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /goal kcvv/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  // ─── Squad badge (Ploeg field) ──────────────────────────────────────────

  it("picking a match with a known squad prefills Ploeg with its short form, and the badge appears in the live preview", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    const matchInput = screen.getByPlaceholderText(/KCVV Elewijt/i);
    await user.type(matchInput, MATCHES[0]!.matchName);

    expect(screen.getByPlaceholderText("A")).toHaveValue("A");
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("picking a different known match replaces the badge", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    const matchInput = screen.getByPlaceholderText(/KCVV Elewijt/i);
    await user.type(matchInput, MATCHES[0]!.matchName);
    expect(screen.getByPlaceholderText("A")).toHaveValue("A");

    await user.clear(matchInput);
    await user.type(matchInput, MATCHES[1]!.matchName);

    expect(screen.getByPlaceholderText("A")).toHaveValue("B");
    expect(screen.queryByText("A")).not.toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("clearing the Ploeg field removes the badge from the preview", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    const matchInput = screen.getByPlaceholderText(/KCVV Elewijt/i);
    await user.type(matchInput, MATCHES[0]!.matchName);
    expect(screen.getByText("A")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("A"));

    expect(screen.queryByText("A")).not.toBeInTheDocument();
  });

  it("typing a squad by hand puts it on the preview for a free-typed matchup", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.type(
      screen.getByPlaceholderText(/KCVV Elewijt/i),
      "KCVV Elewijt — Rapid Leest",
    );
    await user.type(screen.getByPlaceholderText("A"), "U21");

    expect(screen.getByText("U21")).toBeInTheDocument();
  });

  it("the Ploeg value survives a template switch (unlike Minuut / Speler / Resultaat)", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.type(screen.getByPlaceholderText("A"), "U15");
    await user.click(screen.getByRole("button", { name: /aftrap/i }));

    expect(screen.getByPlaceholderText("A")).toHaveValue("U15");
  });

  it("editing the Ploeg field after Genereer clears the generated preview", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await user.click(screen.getByRole("button", { name: /genereer/i }));
    expect(screen.getByRole("img", { name: /preview/i })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("A"), "A");

    expect(
      screen.queryByRole("img", { name: /preview/i }),
    ).not.toBeInTheDocument();
  });

  it("picking a match by its unique datalist label keeps the rendered matchup club-names-only", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    const matchInput = screen.getByPlaceholderText(/KCVV Elewijt/i);
    await user.type(matchInput, MATCHES[0]!.label);

    // The suffix-bearing label resolves to the clean club-names-only
    // matchup — the suffix must never reach the input or the canvas.
    expect(matchInput).toHaveValue(MATCHES[0]!.matchName);
    expect((matchInput as HTMLInputElement).value).not.toContain("(");
    expect(screen.getByPlaceholderText("A")).toHaveValue("A");
  });

  it("picking the second of two matches that share a matchName badges the second squad, not the first", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={COLLIDING_MATCHES} players={PLAYERS} />);

    const matchInput = screen.getByPlaceholderText(/KCVV Elewijt/i);
    await user.type(matchInput, COLLIDING_MATCHES[1]!.label);

    expect(matchInput).toHaveValue(COLLIDING_MATCHES[1]!.matchName);
    expect((matchInput as HTMLInputElement).value).not.toContain("(");
    expect(screen.getByPlaceholderText("A")).toHaveValue("U15");
    expect(screen.getByText("U15")).toBeInTheDocument();
  });

  it("re-clicking the active template keeps it selected without churn", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    // Set a session field, then re-click the already-active template.
    const scoreInput = screen.getByPlaceholderText(/2 - 0/i);
    await user.clear(scoreInput);
    await user.type(scoreInput, "3 - 1");

    const goalKcvvBtn = screen.getByRole("button", { name: /goal kcvv/i });
    await user.click(goalKcvvBtn);

    expect(goalKcvvBtn).toHaveAttribute("aria-pressed", "true");
    // The guard returns early, so session fields are untouched.
    expect(screen.getByPlaceholderText(/2 - 0/i)).toHaveValue("3 - 1");
  });

  // ─── News and events in the four new looks (#3540) ─────────────────────

  describe("news and events (#3540)", () => {
    const INTERVIEW: ShareItem = {
      kind: "article",
      slug: "interview-jan",
      type: "interview",
      title: "Jan over zijn eerste seizoen",
      spans: [
        { text: "Jan over zijn ", accent: false },
        { text: "eerste seizoen", accent: true },
      ],
      date: "vrijdag 17 oktober",
      time: "",
      location: "",
      day: "17",
      month: "okt",
      cover: {
        url: "https://cdn.sanity.io/images/p/d/cover.jpg",
        hotspot: { x: 0.3, y: 0.2 },
      },
    };
    const TRANSFER: ShareItem = {
      ...INTERVIEW,
      slug: "transfer-piet",
      type: "transfer",
      title: "Piet tekent bij",
      spans: [{ text: "Piet tekent bij", accent: false }],
    };
    const QUIZ: ShareItem = {
      kind: "event",
      slug: "quiz",
      type: "Supportersactiviteit",
      title: "Supportersquiz",
      spans: [{ text: "Supportersquiz", accent: false }],
      date: "zaterdag 25 oktober",
      time: "20:00",
      location: "Kantine Driesstraat",
      day: "25",
      month: "okt",
      cover: null,
    };
    const ARTICLES = [INTERVIEW, TRANSFER];
    const EVENTS = [QUIZ];

    const renderTool = (initial?: {
      kind: "article" | "event";
      item: ShareItem | null;
    }) =>
      render(
        <SharePage
          matches={MATCHES}
          players={PLAYERS}
          articles={ARTICLES}
          events={EVENTS}
          initial={initial}
        />,
      );
    const preview = () => screen.getByTestId("share-preview");

    it("starts on Wedstrijd and keeps the match form; Nieuws swaps in the article picker and the four looks", async () => {
      const user = userEvent.setup();
      renderTool();

      expect(screen.getByRole("button", { name: "Wedstrijd" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button", { name: /goal kcvv/i })).toBeVisible();
      expect(screen.getByRole("button", { name: "Kaart" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(
        screen.getByRole("button", { name: "W · Wedstrijd" }),
      ).toBeVisible();

      await user.click(screen.getByRole("button", { name: "Nieuws" }));

      expect(
        screen.queryByRole("button", { name: "W · Wedstrijd" }),
      ).toBeNull();

      expect(screen.queryByRole("button", { name: /goal kcvv/i })).toBeNull();
      expect(screen.getByRole("listbox", { name: "Artikels" })).toBeVisible();
      for (const look of ["Kaart", "Plakboek", "Affiche", "Ticket"]) {
        expect(screen.getByRole("button", { name: look })).toBeVisible();
      }
    });

    it("filters the article list as you type", async () => {
      const user = userEvent.setup();
      renderTool();
      await user.click(screen.getByRole("button", { name: "Nieuws" }));

      await user.type(screen.getByLabelText("Zoek artikel"), "tekent");

      const list = screen.getByRole("listbox", { name: "Artikels" });
      expect(within(list).getAllByRole("option")).toHaveLength(1);
      expect(within(list).getByRole("option")).toHaveTextContent(
        "Piet tekent bij",
      );
    });

    it("picking an article prefills its title and draws its type, detail and italic accent", async () => {
      const user = userEvent.setup();
      renderTool();
      await user.click(screen.getByRole("button", { name: "Nieuws" }));
      await user.click(
        screen.getByRole("option", { name: "Jan over zijn eerste seizoen" }),
      );

      expect(screen.getByLabelText("Titel")).toHaveValue(
        "Jan over zijn eerste seizoen",
      );
      expect(within(preview()).getByText("Interview")).toBeInTheDocument();
      expect(within(preview()).getByText("“")).toBeInTheDocument();
      expect(within(preview()).getByText("eerste seizoen").tagName).toBe("EM");
      expect(
        within(preview()).getByText("Meer op kcvvelewijt.be"),
      ).toBeInTheDocument();
    });

    it("an edited title reaches the preview", async () => {
      const user = userEvent.setup();
      renderTool({ kind: "article", item: TRANSFER });

      const title = screen.getByLabelText("Titel");
      await user.clear(title);
      await user.type(title, "Welkom Piet");

      expect(within(preview()).getByText("Welkom Piet")).toBeInTheDocument();
      expect(within(preview()).getByText("Transfer")).toBeInTheDocument();
      expect(within(preview()).getByText("→ KCVV ELEWIJT")).toBeInTheDocument();
    });

    it("an event shows its type label, the date block and <date · hour> / <location> on two lines", () => {
      renderTool({ kind: "event", item: QUIZ });

      expect(screen.getByRole("button", { name: "Evenement" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByLabelText("Locatie")).toHaveValue(
        "Kantine Driesstraat",
      );
      expect(within(preview()).getByText("Supporters")).toBeInTheDocument();
      expect(
        within(preview()).getByText("zaterdag 25 oktober · 20:00"),
      ).toBeInTheDocument();
      expect(
        within(preview()).getByText("Kantine Driesstraat"),
      ).toBeInTheDocument();
      expect(within(preview()).getByText("25")).toBeInTheDocument();
    });

    it("a deep-linked item preselects even when it is not in the list", () => {
      const older: ShareItem = {
        ...TRANSFER,
        slug: "oud",
        title: "Oud nieuws",
        spans: [],
      };
      renderTool({ kind: "article", item: older });

      expect(screen.getByRole("button", { name: "Nieuws" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByLabelText("Titel")).toHaveValue("Oud nieuws");
    });

    it("an unknown deep link opens the empty picker with no preview", () => {
      renderTool({ kind: "event", item: null });

      expect(
        screen.getByRole("listbox", { name: "Evenementen" }),
      ).toBeVisible();
      expect(screen.queryByTestId("share-preview")).toBeNull();
    });

    it("Omslag starts on Affiche wazig; Foto fills the slot positioned on the hotspot, through the same-origin optimizer", async () => {
      const user = userEvent.setup();
      renderTool({ kind: "article", item: INTERVIEW });

      expect(
        screen.getByRole("button", { name: "Affiche wazig" }),
      ).toHaveAttribute("aria-pressed", "true");

      await user.click(screen.getByRole("button", { name: "Foto" }));

      const img = preview().querySelector<HTMLImageElement>(
        "img[src^='/_next/image']",
      )!;
      expect(img.getAttribute("src")).toContain("q=75");
      expect(img.style.objectPosition).toBe("30% 20%");
    });

    it("an event without a cover draws the event fallback picture", () => {
      renderTool({ kind: "event", item: QUIZ });

      expect(
        preview().querySelector("img[src='/images/event-fallback.jpg']"),
      ).not.toBeNull();
    });

    // Omslag only chooses how a cover is shown; without a cover every choice
    // would draw the same fallback, so the row would be a control that does nothing.
    it("hides Omslag for an item without a cover", () => {
      renderTool({ kind: "event", item: QUIZ });

      expect(screen.queryByRole("button", { name: "Reservefoto" })).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Affiche wazig" }),
      ).toBeNull();
    });

    it("Reservefoto swaps the cover for the look's own fallback picture", async () => {
      const user = userEvent.setup();
      renderTool({ kind: "article", item: INTERVIEW });

      await user.click(screen.getByRole("button", { name: "Reservefoto" }));

      expect(
        preview().querySelector("img[src^='/images/share-fallback/A-']"),
      ).not.toBeNull();
    });

    it("Licht / Donker show for every look, the wash steps for Affiche only, defaulting to Licht + Normaal", async () => {
      const user = userEvent.setup();
      renderTool({ kind: "article", item: INTERVIEW });

      expect(screen.getByRole("button", { name: "Licht" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.queryByRole("button", { name: "Normaal" })).toBeNull();

      await user.click(screen.getByRole("button", { name: "Affiche" }));

      expect(screen.getByRole("button", { name: "Normaal" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button", { name: "Zacht" })).toBeVisible();
      expect(screen.getByRole("button", { name: "Sterk" })).toBeVisible();
    });

    it("a match story has Licht / Donker in A–E, none in W, and never an Omslag row", async () => {
      const user = userEvent.setup();
      renderTool();

      expect(screen.getByRole("button", { name: "Licht" })).toBeVisible();
      expect(screen.queryByRole("button", { name: "Foto" })).toBeNull();

      await user.click(screen.getByRole("button", { name: "Affiche" }));
      expect(screen.getByRole("button", { name: "Normaal" })).toBeVisible();

      await pickW(user);
      expect(screen.queryByRole("button", { name: "Licht" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Normaal" })).toBeNull();
    });

    it("captures a news story twice with includeQueryParams at the square size", async () => {
      const { toPng } = await import("html-to-image");
      const user = userEvent.setup();
      renderTool({ kind: "article", item: INTERVIEW });

      await user.click(screen.getByRole("button", { name: /vierkant/i }));
      await user.click(screen.getByRole("button", { name: /genereer/i }));

      expect(toPng).toHaveBeenCalledTimes(2);
      expect(toPng).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          width: SQUARE_SIZE,
          height: SQUARE_SIZE,
          includeQueryParams: true,
        }),
      );
    });
  });

  describe("match moments and the story session (#3536)", () => {
    const KEY = "kcvv-share-session";
    const STORED_MATCH = MATCHES[0]!.label;
    const NEWS: ShareItem = {
      kind: "article",
      slug: "nieuws-1",
      type: "announcement",
      title: "Nieuwe kantine open",
      spans: [{ text: "Nieuwe kantine open", accent: false }],
      date: "vrijdag 17 oktober",
      time: "",
      location: "",
      day: "17",
      month: "okt",
      cover: null,
    };
    const OTHER_NEWS: ShareItem = {
      ...NEWS,
      slug: "nieuws-2",
      title: "Ander nieuws",
      spans: [],
    };

    const renderTool = () =>
      render(
        <SharePage
          matches={MATCHES}
          players={PLAYERS}
          articles={[NEWS, OTHER_NEWS]}
        />,
      );
    const preview = () => screen.getByTestId("share-preview");
    const previewHtml = () => preview().innerHTML;
    const pressed = (name: string) =>
      screen.getByRole("button", { name }).getAttribute("aria-pressed");
    const save = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByRole("button", { name: /genereer/i }));
      await user.click(screen.getByRole("button", { name: /download png/i }));
    };
    const fillMatch = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(
        screen.getByPlaceholderText(/fc tegenstander/i),
        STORED_MATCH,
      );
      await user.type(screen.getByPlaceholderText("2 - 0"), "2 - 1");
      await user.type(screen.getByPlaceholderText("45+2"), "67");
    };

    beforeEach(() => {
      // happy-dom would navigate to the blob URL; the click itself is what counts.
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        () => {},
      );
    });
    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it("a fresh phone starts a match on A Kaart: the moment's label, minute disc and score, the squad badge, the look's first fallback picture", async () => {
      const user = userEvent.setup();
      renderTool();
      await fillMatch(user);

      expect(pressed("Kaart")).toBe("true");
      const p = within(preview());
      expect(p.getByText("Goal")).toBeInTheDocument();
      expect(p.getByText("2–1")).toBeInTheDocument();
      expect(p.getByText("67'", { exact: false })).toBeInTheDocument();
      expect(p.getByText("A")).toBeInTheDocument();
      expect(previewHtml()).toContain("share-fallback/A-1.webp");

      await user.click(screen.getByRole("button", { name: "Rust" }));
      expect(within(preview()).getByText("45'")).toBeInTheDocument();
    });

    it("W keeps its own drawn no-photo poster", async () => {
      const user = userEvent.setup();
      renderTool();
      await pickW(user);
      expect(previewHtml()).not.toContain("share-fallback");
    });

    it("a reload brings the match details back", async () => {
      const user = userEvent.setup();
      const { unmount } = renderTool();
      await fillMatch(user);
      await user.click(screen.getByRole("button", { name: "Donker" }));
      unmount();

      renderTool();
      expect(screen.getByPlaceholderText(/fc tegenstander/i)).toHaveValue(
        MATCHES[0]!.matchName,
      );
      expect(screen.getByPlaceholderText("2 - 0")).toHaveValue("2 - 1");
      expect(screen.getByPlaceholderText("45+2")).toHaveValue("67");
      expect(screen.getByPlaceholderText("A")).toHaveValue("A");
      expect(pressed("Donker")).toBe("true");
    });

    it("a news story's edited fields come back after a reload; another article clears them", async () => {
      const user = userEvent.setup();
      const { unmount } = renderTool();
      await user.click(screen.getByRole("button", { name: "Nieuws" }));
      await user.click(screen.getByRole("option", { name: NEWS.title }));
      await user.clear(screen.getByLabelText("Titel"));
      await user.type(screen.getByLabelText("Titel"), "Kantine open!");
      unmount();

      renderTool();
      expect(screen.getByLabelText("Titel")).toHaveValue("Kantine open!");
      await user.click(screen.getByRole("option", { name: OTHER_NEWS.title }));
      expect(screen.getByLabelText("Titel")).toHaveValue("Ander nieuws");
    });

    it("the next Brussels day starts a new story but keeps the look", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-10-17T21:30:00Z")); // 23:30 in Brussels
      const user = userEvent.setup();
      const { unmount } = renderTool();
      await fillMatch(user);
      await user.click(screen.getByRole("button", { name: "Ticket" }));
      unmount();

      vi.setSystemTime(new Date("2026-10-17T22:30:00Z")); // 00:30, next day
      renderTool();
      expect(screen.getByPlaceholderText(/fc tegenstander/i)).toHaveValue("");
      expect(pressed("Ticket")).toBe("true");
    });

    it("picking another match clears the last one's score and minute", async () => {
      const user = userEvent.setup();
      renderTool();
      await fillMatch(user);
      const input = screen.getByPlaceholderText(/fc tegenstander/i);
      await user.clear(input);
      await user.type(input, MATCHES[1]!.label);

      expect(screen.getByPlaceholderText("2 - 0")).toHaveValue("");
      expect(screen.getByPlaceholderText("45+2")).toHaveValue("");
    });

    it("a store that throws, or holds junk, still renders a fresh tool", () => {
      localStorage.setItem(KEY, "{not json");
      const { unmount } = renderTool();
      expect(pressed("Kaart")).toBe("true");
      unmount();

      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      renderTool();
      expect(pressed("Kaart")).toBe("true");
    });

    it("an own photo is never stored", async () => {
      const user = userEvent.setup();
      renderTool();
      await user.upload(
        screen.getByLabelText(/foto uploaden/i),
        new File(["x"], "me.png", { type: "image/png" }),
      );
      expect(previewHtml()).toContain("blob:");
      expect(localStorage.getItem(KEY)).not.toContain("blob:");
    });

    it("after each saved PNG a match moves A → B → C → E → W and wraps; news skips W", async () => {
      const user = userEvent.setup();
      renderTool();
      for (const next of [
        "Plakboek",
        "Affiche",
        "Ticket",
        "W · Wedstrijd",
        "Kaart",
      ]) {
        await save(user);
        expect(pressed(next)).toBe("true");
      }

      await user.click(screen.getByRole("button", { name: "Nieuws" }));
      await user.click(screen.getByRole("option", { name: NEWS.title }));
      await user.click(screen.getByRole("button", { name: "Ticket" }));
      await save(user);
      expect(pressed("Kaart")).toBe("true");
    });

    it("a saved PNG that used a fallback moves the look to its next picture, wrapping on the uneven set", async () => {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          look: "kaart",
          fallbackNext: { kaart: 4 },
          story: null,
        }),
      );
      const user = userEvent.setup();
      renderTool();
      expect(previewHtml()).toContain("share-fallback/A-8.webp");

      await save(user);
      await user.click(screen.getByRole("button", { name: "Kaart" }));
      expect(previewHtml()).toContain("share-fallback/A-1.webp");
    });

    it("a coverless event shows the event fallback, so its save leaves the AI rotation alone", async () => {
      const EVENT: ShareItem = {
        ...NEWS,
        kind: "event",
        slug: "quiz",
        type: "Andere",
        title: "Quiz",
      };
      const user = userEvent.setup();
      render(
        <SharePage matches={MATCHES} players={PLAYERS} events={[EVENT]} />,
      );
      await user.click(screen.getByRole("button", { name: "Evenement" }));
      await user.click(screen.getByRole("option", { name: "Quiz" }));
      await save(user);
      expect(JSON.parse(localStorage.getItem(KEY)!).fallbackNext).toEqual({});
    });

    it("re-picking the same match after typing keeps its score", async () => {
      const user = userEvent.setup();
      renderTool();
      await fillMatch(user);
      const input = screen.getByPlaceholderText(/fc tegenstander/i);
      await user.type(input, "x");
      await user.clear(input);
      await user.type(input, STORED_MATCH);
      expect(screen.getByPlaceholderText("2 - 0")).toHaveValue("2 - 1");
    });

    it("a stored fallback index past its set wraps on read; unknown looks are dropped", () => {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          look: "kaart",
          fallbackNext: { kaart: 9, bogus: 2 },
          story: null,
        }),
      );
      renderTool();
      // Kaart's set has 5 pictures: 9 % 5 = 4 → A-8.
      expect(previewHtml()).toContain("share-fallback/A-8.webp");
      expect(JSON.parse(localStorage.getItem(KEY)!).fallbackNext).toEqual({
        kaart: 4,
      });
    });

    it("a saved PNG resets Omslag for the next story", async () => {
      const COVERED = {
        ...NEWS,
        cover: {
          url: "https://cdn.sanity.io/images/p/d/c.jpg",
          hotspot: { x: 0.5, y: 0.5 },
        },
      };
      const user = userEvent.setup();
      render(
        <SharePage matches={MATCHES} players={PLAYERS} articles={[COVERED]} />,
      );
      await user.click(screen.getByRole("button", { name: "Nieuws" }));
      await user.click(screen.getByRole("option", { name: NEWS.title }));
      await user.click(screen.getByRole("button", { name: "Foto" }));
      await save(user);
      expect(pressed("Affiche wazig")).toBe("true");
    });
  });

  describe("movable blocks (#3537)", () => {
    const KEY = "kcvv-share-session";
    const NEWS: ShareItem = {
      kind: "article",
      slug: "nieuws-1",
      type: "announcement",
      title: "Nieuwe kantine open",
      spans: [{ text: "Nieuwe kantine open", accent: false }],
      date: "vrijdag 17 oktober",
      time: "",
      location: "",
      day: "17",
      month: "okt",
      cover: null,
    };
    const OTHER_NEWS: ShareItem = { ...NEWS, slug: "nieuws-2", title: "Ander" };
    const MOVED = { x: 40, y: -80, layer: "voor" };

    /** A stored story of today, on `look`, with a moved block per format. */
    const seed = (story: Record<string, unknown> = {}, look = "kaart") =>
      localStorage.setItem(
        KEY,
        JSON.stringify({
          look,
          fallbackNext: {},
          story: {
            day: clubToday(),
            mode: "match",
            template: "goal-kcvv",
            format: "story",
            theme: "licht",
            wash: "normaal",
            coverMode: "foto",
            match: {},
            itemSlug: null,
            fields: null,
            blocks: {
              story: { tekst: MOVED },
              square: { tekst: { x: 0, y: 12, layer: "voor" } },
            },
            ...story,
          },
        }),
      );
    const renderTool = () =>
      render(
        <SharePage
          matches={MATCHES}
          players={PLAYERS}
          articles={[NEWS, OTHER_NEWS]}
        />,
      );
    const block = (id: string) =>
      screen
        .getByTestId("share-preview")
        .querySelector<HTMLElement>(`[data-block="${id}"]`)!;
    const storedBlocks = () =>
      JSON.parse(localStorage.getItem(KEY)!).story.blocks;
    const EMPTY = { story: {}, square: {} };

    beforeEach(() => {
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        () => {},
      );
    });
    afterEach(() => vi.restoreAllMocks());

    it("a stored layout comes back after a reload, as a translate on the block", () => {
      seed();
      renderTool();
      expect(block("tekst").style.transform).toBe("translate(40px, -80px)");
      expect(block("hero").style.transform).toBe("");
      expect(storedBlocks().story).toEqual({ tekst: MOVED });
    });

    it("story and square keep their own layouts", async () => {
      seed();
      const user = userEvent.setup();
      renderTool();
      await user.click(screen.getByRole("button", { name: /vierkant/i }));
      expect(block("tekst").style.transform).toBe("translate(0px, 12px)");
      await user.click(screen.getByRole("button", { name: /story/i }));
      expect(block("tekst").style.transform).toBe("translate(40px, -80px)");
    });

    it("W moves the middle zone's children", () => {
      seed(
        {
          template: "kickoff",
          blocks: { story: { w1: MOVED }, square: {} },
        },
        "wedstrijd",
      );
      renderTool();
      expect(block("w1").style.translate).toBe("40px -80px");
    });

    it("Achter puts the last moved block under the pinned parts; Voor back on top", async () => {
      seed();
      const user = userEvent.setup();
      renderTool();
      await user.click(screen.getByRole("button", { name: "Schik" }));
      await user.click(screen.getByRole("button", { name: "Achter" }));
      expect(Number(block("tekst").style.zIndex)).toBeLessThan(20);
      expect(storedBlocks().story.tekst.layer).toBe("achter");
      await user.click(screen.getByRole("button", { name: "Voor" }));
      expect(Number(block("tekst").style.zIndex)).toBeGreaterThan(20);
    });

    it("Midden can be switched off", async () => {
      const user = userEvent.setup();
      renderTool();
      await user.click(screen.getByRole("button", { name: "Schik" }));
      const midden = screen.getByRole("button", { name: "Midden" });
      expect(midden).toHaveAttribute("aria-pressed", "true");
      await user.click(midden);
      expect(midden).toHaveAttribute("aria-pressed", "false");
    });

    it("Alles terugzetten clears the layout", async () => {
      seed();
      const user = userEvent.setup();
      renderTool();
      await user.click(screen.getByRole("button", { name: "Schik" }));
      await user.click(
        screen.getByRole("button", { name: "Alles terugzetten" }),
      );
      expect(block("tekst").style.transform).toBe("");
      expect(storedBlocks().story).toEqual({});
    });

    it("a saved PNG clears both layouts", async () => {
      seed();
      const user = userEvent.setup();
      renderTool();
      await user.click(screen.getByRole("button", { name: /genereer/i }));
      await user.click(screen.getByRole("button", { name: /download png/i }));
      expect(storedBlocks()).toEqual(EMPTY);
    });

    it("another look clears the layout", async () => {
      seed();
      const user = userEvent.setup();
      renderTool();
      await user.click(screen.getByRole("button", { name: "Ticket" }));
      expect(storedBlocks()).toEqual(EMPTY);
    });

    it("another template clears the layout", async () => {
      seed();
      const user = userEvent.setup();
      renderTool();
      await user.click(screen.getByRole("button", { name: "Rust" }));
      expect(storedBlocks()).toEqual(EMPTY);
    });

    it("another item clears the layout", async () => {
      seed({ mode: "article", itemSlug: NEWS.slug });
      const user = userEvent.setup();
      renderTool();
      expect(block("tekst").style.transform).toBe("translate(40px, -80px)");
      await user.click(screen.getByRole("option", { name: OTHER_NEWS.title }));
      expect(storedBlocks()).toEqual(EMPTY);
    });

    it("another match clears the layout", async () => {
      seed({ match: { id: MATCHES[0]!.id, name: MATCHES[0]!.matchName } });
      const user = userEvent.setup();
      renderTool();
      const input = screen.getByPlaceholderText(/fc tegenstander/i);
      await user.clear(input);
      expect(storedBlocks().story).toEqual({ tekst: MOVED });
      await user.type(input, MATCHES[1]!.label);
      expect(storedBlocks()).toEqual(EMPTY);
    });

    it("a stored layout with junk keeps only the valid blocks", () => {
      seed({
        blocks: {
          story: {
            tekst: MOVED,
            bad: { x: "1", y: 0, layer: "voor" },
            odd: { x: 1, y: 2, layer: "zijkant" },
          },
          square: "nope",
        },
      });
      renderTool();
      expect(storedBlocks()).toEqual({
        story: { tekst: MOVED, odd: { x: 1, y: 2, layer: "voor" } },
        square: {},
      });
    });
  });
});

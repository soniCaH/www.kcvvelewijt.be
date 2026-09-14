import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CAPTURE_WIDTH, CAPTURE_HEIGHT, SQUARE_SIZE } from "../constants";
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

  it("switching to Square shows only the two square templates", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

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

    await user.click(screen.getByRole("button", { name: /eindstand/i }));

    expect(screen.getByPlaceholderText(/2e provinciale/i)).toBeInTheDocument();
  });

  it("shows the photo upload for image-capable templates only", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

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
});

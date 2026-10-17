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

type User = ReturnType<typeof userEvent.setup>;
type Tab = "Inhoud" | "Stijl" | "Tekst" | "Schik";

/** Opens a tab of the bottom bar; a tap on the open tab would close it. */
const openTab = async (user: User, name: Tab) => {
  const tab = screen.getByRole("button", { name });
  if (tab.getAttribute("aria-expanded") !== "true") await user.click(tab);
};
const tabButton = (name: Tab) => screen.getByRole("button", { name });
const panel = () => screen.getByRole("region");
const preview = () => screen.getByTestId("share-preview");
const lookStrip = () => screen.queryByRole("group", { name: "Look" });
/** Bewaar PNG; "Deel PNG" while a PNG whose share did not go through is kept. */
const saveButton = () =>
  screen.getByRole("button", { name: /^(Bewaar|Deel) PNG$/ });
const save = (user: User) => user.click(saveButton());

/** Today's templates are look W; a fresh phone starts on A Kaart (#3536). */
const pickW = (user: User) =>
  user.click(screen.getByRole("button", { name: "W · Wedstrijd" }));
/** A moment chip in Inhoud. */
const pickMoment = async (user: User, name: string | RegExp) => {
  await openTab(user, "Inhoud");
  await user.click(screen.getByRole("button", { name }));
};
/** The match list in Inhoud: type to search, tap a hit. */
const pickMatch = async (user: User, match: MatchOption) => {
  await openTab(user, "Inhoud");
  await user.click(
    within(screen.getByRole("group", { name: "Wedstrijden" })).getByRole(
      "button",
      { name: match.label },
    ),
  );
};

/** Swaps `navigator.share` / `canShare` for one test. */
function stubShare(share?: (data: ShareData) => Promise<void>) {
  const original = { share: navigator.share, canShare: navigator.canShare };
  const define = (key: "share" | "canShare", value: unknown) =>
    Object.defineProperty(navigator, key, {
      value,
      writable: true,
      configurable: true,
    });
  define("canShare", () => true);
  if (share) define("share", share);
  return () => {
    define("share", original.share);
    define("canShare", original.canShare);
  };
}

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
// share an identical matchName — the list label is the only unique field.
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
    // happy-dom would navigate to the blob URL; the click itself is what counts.
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ─── The phone layout (#3538) ────────────────────────────────────────────

  describe("phone layout (#3538)", () => {
    it("is one full-screen layer over the site chrome, preview on top, tabs and Bewaar PNG at the bottom", () => {
      render(<SharePage matches={MATCHES} players={PLAYERS} />);

      const tool = document.getElementById("share-tool")!;
      expect(tool.className).toMatch(/\bfixed\b/);
      expect(tool.className).toMatch(/\binset-0\b/);
      expect(within(tool).getByTestId("share-preview")).toBeInTheDocument();
      for (const name of ["Inhoud", "Stijl", "Tekst", "Schik"] as const) {
        expect(tabButton(name)).toHaveAttribute("aria-expanded", "false");
      }
      expect(saveButton()).toBeEnabled();
      // No panel until a tab is tapped: the preview gets the room.
      expect(screen.queryByRole("region")).toBeNull();
    });

    it("a tab opens its panel; tapping the open tab closes it; another tab swaps it", async () => {
      const user = userEvent.setup();
      render(<SharePage matches={MATCHES} players={PLAYERS} />);

      await user.click(tabButton("Stijl"));
      expect(tabButton("Stijl")).toHaveAttribute("aria-expanded", "true");
      expect(panel()).toHaveAccessibleName("Stijl");

      await user.click(tabButton("Tekst"));
      expect(tabButton("Stijl")).toHaveAttribute("aria-expanded", "false");
      expect(panel()).toHaveAccessibleName("Tekst");

      await user.click(tabButton("Tekst"));
      expect(screen.queryByRole("region")).toBeNull();
    });

    it("Inhoud holds the mode switch, the match search, the moment chips and Eigen foto", async () => {
      const user = userEvent.setup();
      render(<SharePage matches={MATCHES} players={PLAYERS} />);
      await openTab(user, "Inhoud");

      const p = within(panel());
      expect(p.getByRole("button", { name: "Nieuws" })).toBeInTheDocument();
      expect(p.getByRole("group", { name: "Wedstrijden" })).toBeVisible();
      expect(p.getByRole("button", { name: "Goal KCVV" })).toBeVisible();
      expect(p.getByLabelText("Foto uploaden")).toBeInTheDocument();
      expect(p.getByText("Eigen foto…")).toBeVisible();
    });

    it("Stijl holds Licht / Donker and Story / Vierkant", async () => {
      const user = userEvent.setup();
      render(<SharePage matches={MATCHES} players={PLAYERS} />);
      await openTab(user, "Stijl");

      const p = within(panel());
      expect(p.getByRole("button", { name: "Licht" })).toBeVisible();
      expect(p.getByRole("button", { name: /story · 9:16/i })).toBeVisible();
      expect(p.getByRole("button", { name: /vierkant · 1:1/i })).toBeVisible();
    });

    it("Tekst holds the moment's fields", async () => {
      const user = userEvent.setup();
      render(<SharePage matches={MATCHES} players={PLAYERS} />);
      await openTab(user, "Tekst");

      const p = within(panel());
      expect(
        p.getByPlaceholderText("KCVV Elewijt — FC Tegenstander"),
      ).toBeInTheDocument();
      expect(p.getByPlaceholderText("A")).toBeInTheDocument();
      expect(p.getByPlaceholderText("2 - 0")).toBeInTheDocument();
      expect(p.getByPlaceholderText("45+2")).toBeInTheDocument();
      expect(p.getByLabelText(/zoek speler/i)).toBeInTheDocument();
    });

    it("Schik turns drag mode on, holds Midden, Voor / Achter and Alles terugzetten, and hides the look strip", async () => {
      const user = userEvent.setup();
      render(<SharePage matches={MATCHES} players={PLAYERS} />);
      expect(lookStrip()).not.toBeNull();
      expect(preview().className).not.toContain("touch-none");

      await openTab(user, "Schik");

      const p = within(panel());
      expect(p.getByRole("button", { name: "Midden" })).toBeVisible();
      expect(p.getByRole("button", { name: "Voor" })).toBeDisabled();
      expect(p.getByRole("button", { name: "Achter" })).toBeDisabled();
      expect(
        p.getByRole("button", { name: "Alles terugzetten" }),
      ).toBeDisabled();
      expect(preview().className).toContain("touch-none");
      expect(lookStrip()).toBeNull();

      await user.click(tabButton("Schik"));
      expect(lookStrip()).not.toBeNull();
      expect(preview().className).not.toContain("touch-none");
    });

    it("the look strip shows a live thumbnail of every fitting look", async () => {
      const user = userEvent.setup();
      render(<SharePage matches={MATCHES} players={PLAYERS} />);

      const strip = within(lookStrip()!);
      const names = ["Kaart", "Plakboek", "Affiche", "Ticket", "W · Wedstrijd"];
      expect(strip.getAllByRole("button")).toHaveLength(names.length);
      const looks = names.map((name) => strip.getByRole("button", { name }));
      // Each thumbnail draws the story itself: Kaart's thumbnail carries the
      // look's own fallback picture, W its own poster.
      expect(looks[0]!.innerHTML).toContain("share-fallback/A-");
      expect(looks[4]!.innerHTML).not.toContain("share-fallback");

      // A typed score reaches every thumbnail live.
      await openTab(user, "Tekst");
      await user.type(screen.getByPlaceholderText("2 - 0"), "3 - 1");
      for (const look of within(lookStrip()!).getAllByRole("button")) {
        expect(look.textContent).toMatch(/3\s*(–|-)\s*1/);
      }
    });

    it("the preview is fitted to the free space", () => {
      const observed: ResizeObserverCallback[] = [];
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(cb: ResizeObserverCallback) {
            observed.push(cb);
          }
          observe(el: Element) {
            observed.at(-1)!(
              [
                {
                  target: el,
                  contentRect: { width: 343, height: 1000 },
                } as unknown as ResizeObserverEntry,
              ],
              this as unknown as ResizeObserver,
            );
          }
          disconnect() {}
          unobserve() {}
        },
      );
      try {
        render(<SharePage matches={MATCHES} players={PLAYERS} />);
        // 343 px wide (a 375 px phone less its gutters) minus the 2 px border
        // on each side: the canvas is drawn 339 px wide, at 339 / 1080.
        expect(preview().style.width).toBe("339px");
        expect(parseFloat(preview().style.height)).toBeCloseTo(
          (339 / 1080) * 1920,
          3,
        );
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  // ─── Bewaar PNG (#3538) ──────────────────────────────────────────────────

  describe("Bewaar PNG", () => {
    // Two calls: iOS Safari drops nested images on the first rasterization, so
    // the capture is warmed up once and only the second result is kept.
    // includeQueryParams: without it html-to-image keys its resource cache on
    // the URL minus the query string, so every `/_next/image?url=…` shares one
    // entry and later captures reuse the first image fetched.
    it("captures twice at 1080x1920, pixelRatio 1, with includeQueryParams, then downloads where sharing files is not possible", async () => {
      const { toPng } = await import("html-to-image");
      const user = userEvent.setup();
      render(<SharePage matches={MATCHES} players={PLAYERS} />);

      await save(user);

      expect(toPng).toHaveBeenCalledTimes(2);
      expect(toPng).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          width: CAPTURE_WIDTH,
          height: CAPTURE_HEIGHT,
          pixelRatio: 1,
          includeQueryParams: true,
        }),
      );
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    });

    it("captures the square at 1080x1080", async () => {
      const { toPng } = await import("html-to-image");
      const user = userEvent.setup();
      render(<SharePage matches={MATCHES} players={PLAYERS} />);

      await openTab(user, "Stijl");
      await user.click(screen.getByRole("button", { name: /vierkant · 1:1/i }));
      await save(user);

      expect(toPng).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ width: SQUARE_SIZE, height: SQUARE_SIZE }),
      );
    });

    it("opens the share sheet with one PNG file in the same tap", async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      const restore = stubShare(share);
      try {
        const user = userEvent.setup();
        render(<SharePage matches={MATCHES} players={PLAYERS} />);

        await save(user);

        expect(share).toHaveBeenCalledTimes(1);
        const { files } = share.mock.calls[0]![0] as { files: File[] };
        expect(files).toHaveLength(1);
        expect(files[0]).toBeInstanceOf(File);
        expect(files[0]!.type).toBe("image/png");
        expect(files[0]!.name).toMatch(/^kcvv-.*\.png$/);
        expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
      } finally {
        restore();
      }
    });

    it("a cancelled share shows no notice and keeps the PNG: the next tap reopens the sheet without a new capture", async () => {
      const { toPng } = await import("html-to-image");
      const abort = Object.assign(new Error("Share cancelled"), {
        name: "AbortError",
      });
      const share = vi
        .fn()
        .mockRejectedValueOnce(abort)
        .mockResolvedValueOnce(undefined);
      const restore = stubShare(share);
      try {
        const user = userEvent.setup();
        render(<SharePage matches={MATCHES} players={PLAYERS} />);

        await save(user);
        expect(screen.queryByRole("alert")).toBeNull();
        // Tapping the look already on screen changes nothing.
        await user.click(screen.getByRole("button", { name: "Kaart" }));
        expect(saveButton()).toHaveTextContent("Deel PNG");
        await save(user);

        expect(share).toHaveBeenCalledTimes(2);
        expect(toPng).toHaveBeenCalledTimes(2);
      } finally {
        restore();
      }
    });

    // iOS refuses the share when the tap's user activation expired during the
    // two captures: that is no failure, and the second tap shares the kept PNG.
    it("a share refused for an expired tap shows no notice; the button reads Deel PNG and shares the kept PNG", async () => {
      const { toPng } = await import("html-to-image");
      const refused = Object.assign(new Error("Not allowed"), {
        name: "NotAllowedError",
      });
      const share = vi
        .fn()
        .mockRejectedValueOnce(refused)
        .mockResolvedValueOnce(undefined);
      const restore = stubShare(share);
      try {
        const user = userEvent.setup();
        render(<SharePage matches={MATCHES} players={PLAYERS} />);

        await save(user);
        expect(screen.queryByRole("alert")).toBeNull();
        expect(saveButton()).toHaveTextContent("Deel PNG");

        await save(user);
        expect(share).toHaveBeenCalledTimes(2);
        expect(toPng).toHaveBeenCalledTimes(2);
        expect(saveButton()).toHaveTextContent("Bewaar PNG");
      } finally {
        restore();
      }
    });

    it("the panel, look strip and preview are inert while the PNG is made", async () => {
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
      await openTab(user, "Tekst");

      await save(user);
      expect(panel()).toHaveAttribute("inert");
      expect(lookStrip()).toHaveAttribute("inert");
      expect(preview()).toHaveAttribute("inert");

      resolveToPng("data:image/png;base64,ABC");
      expect(await screen.findByText("Bewaar PNG")).toBeInTheDocument();
      expect(panel()).not.toHaveAttribute("inert");
    });

    it("a change after a cancelled share drops the kept PNG and revokes its URL", async () => {
      const { toPng } = await import("html-to-image");
      const abort = Object.assign(new Error("Share cancelled"), {
        name: "AbortError",
      });
      const restore = stubShare(vi.fn().mockRejectedValue(abort));
      try {
        const user = userEvent.setup();
        render(<SharePage matches={MATCHES} players={PLAYERS} />);

        await save(user);
        await openTab(user, "Tekst");
        await user.type(screen.getByPlaceholderText("A"), "A");
        expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(
          mockObjectUrl,
        );

        await save(user);
        expect(toPng).toHaveBeenCalledTimes(4);
      } finally {
        restore();
      }
    });

    it("ignores a second tap while the first is still busy", async () => {
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

      const btn = saveButton();
      await user.click(btn);
      await user.click(btn);

      expect(toPng).toHaveBeenCalledTimes(1);
      resolveToPng("data:image/png;base64,ABC");
    });

    describe("generate failure (#2818)", () => {
      it("shows the locked notice through <EmptyState>, logs the caught error to the console only, never leaks its message, and the button stays its own retry", async () => {
        const { toPng } = await import("html-to-image");
        const generateError = new Error("CORS error");
        vi.mocked(toPng).mockRejectedValueOnce(generateError);
        const consoleError = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const user = userEvent.setup();

        render(<SharePage matches={MATCHES} players={PLAYERS} />);
        await save(user);

        // The accented substring splits the sentence across DOM nodes, so
        // assert on the notice's own alert region's full text content.
        const notice = await screen.findByRole("alert");
        expect(notice).toHaveTextContent(
          "Exporteren mislukt. Probeer opnieuw.",
        );
        // `<EmptyState tier="slot" reason="unavailable">`'s frame, not the
        // retired bespoke `text-card-red` paragraph.
        expect(notice.className).not.toContain("text-card-red");
        expect(notice.className).toContain("border-dashed");
        expect(screen.queryByText("CORS error")).not.toBeInTheDocument();
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining("generate"),
          generateError,
        );
        expect(saveButton()).toBeEnabled();
        expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
      });
    });

    describe("share failure (#2818)", () => {
      it("shows the locked notice, logs the caught error to the console only and never leaks its message", async () => {
        const shareError = new Error("Permission denied");
        const restore = stubShare(vi.fn().mockRejectedValue(shareError));
        const consoleError = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        try {
          const user = userEvent.setup();
          render(<SharePage matches={MATCHES} players={PLAYERS} />);
          await save(user);

          const notice = await screen.findByRole("alert");
          expect(notice).toHaveTextContent("Delen mislukt. Probeer opnieuw.");
          expect(screen.queryByText("Permission denied")).toBeNull();
          expect(consoleError).toHaveBeenCalledWith(
            expect.stringContaining("share"),
            shareError,
          );
        } finally {
          restore();
        }
      });

      it("a retry that shares clears the notice (#2818 review finding 1)", async () => {
        const restore = stubShare(
          vi
            .fn()
            .mockRejectedValueOnce(new Error("Permission denied"))
            .mockResolvedValueOnce(undefined),
        );
        vi.spyOn(console, "error").mockImplementation(() => {});
        try {
          const user = userEvent.setup();
          render(<SharePage matches={MATCHES} players={PLAYERS} />);
          await save(user);
          await screen.findByRole("alert");

          await save(user);

          expect(screen.queryByRole("alert")).toBeNull();
        } finally {
          restore();
        }
      });

      it("a change to the story clears the notice (#2818 review finding 1)", async () => {
        const restore = stubShare(
          vi.fn().mockRejectedValue(new Error("Permission denied")),
        );
        vi.spyOn(console, "error").mockImplementation(() => {});
        try {
          const user = userEvent.setup();
          render(<SharePage matches={MATCHES} players={PLAYERS} />);
          await save(user);
          await screen.findByRole("alert");

          await openTab(user, "Tekst");
          await user.type(
            screen.getByPlaceholderText("KCVV Elewijt — FC Tegenstander"),
            "x",
          );

          expect(screen.queryByRole("alert")).toBeNull();
        } finally {
          restore();
        }
      });
    });
  });

  // ─── Moments (Inhoud) and their fields (Tekst) ───────────────────────────

  it("W offers its 9 story moments; A–E offer all 11", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await openTab(user, "Inhoud");
    expect(
      screen.getByRole("button", { name: "Eindstand 1:1" }),
    ).toBeInTheDocument();
    await pickW(user);
    expect(screen.queryByRole("button", { name: "Eindstand 1:1" })).toBeNull();
    for (const label of [
      /goal kcvv/i,
      /goal teg/i,
      /aftrap/i,
      /rust/i,
      /eindstand/i,
      /rode kaart kcvv/i,
      /rode kaart teg/i,
      /gele kaart kcvv/i,
      /gele kaart teg/i,
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("in W, Vierkant shows only the two square moments", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await pickW(user);

    await openTab(user, "Stijl");
    await user.click(screen.getByRole("button", { name: /vierkant · 1:1/i }));
    await openTab(user, "Inhoud");

    expect(screen.getByRole("button", { name: /pre-game/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /goal kcvv/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /rust/i })).toBeNull();
  });

  it("starts on Goal KCVV and Story; tapping the active moment or format changes nothing", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await openTab(user, "Tekst");
    await user.type(screen.getByPlaceholderText("2 - 0"), "3 - 1");

    await openTab(user, "Inhoud");
    const goal = screen.getByRole("button", { name: /goal kcvv/i });
    expect(goal).toHaveAttribute("aria-pressed", "true");
    await user.click(goal);
    expect(goal).toHaveAttribute("aria-pressed", "true");

    await openTab(user, "Stijl");
    const story = screen.getByRole("button", { name: /story · 9:16/i });
    expect(story).toHaveAttribute("aria-pressed", "true");
    await user.click(story);
    expect(story).toHaveAttribute("aria-pressed", "true");

    await openTab(user, "Tekst");
    expect(screen.getByPlaceholderText("2 - 0")).toHaveValue("3 - 1");
  });

  it("each moment shows only its own fields in Tekst", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    const fields = async (moment: string | RegExp) => {
      await pickMoment(user, moment);
      expect(screen.getByRole("button", { name: moment })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await openTab(user, "Tekst");
      return {
        score: screen.queryByPlaceholderText("2 - 0") !== null,
        minute: screen.queryByPlaceholderText("45+2") !== null,
        player: screen.queryByLabelText(/zoek speler/i) !== null,
        competition: screen.queryByPlaceholderText(/2e provinciale/i) !== null,
        mood: screen.queryByRole("button", { name: "Gewonnen" }) !== null,
      };
    };
    const none = {
      score: false,
      minute: false,
      player: false,
      competition: false,
      mood: false,
    };

    expect(await fields(/goal kcvv/i)).toEqual({
      ...none,
      score: true,
      minute: true,
      player: true,
    });
    expect(await fields(/goal teg/i)).toEqual({
      ...none,
      score: true,
      minute: true,
      competition: true,
    });
    expect(await fields(/aftrap/i)).toEqual({ ...none, competition: true });
    expect(await fields(/rust/i)).toEqual({
      ...none,
      score: true,
      competition: true,
    });
    expect(await fields("Eindstand")).toEqual({
      ...none,
      score: true,
      competition: true,
      mood: true,
    });
    expect(await fields(/rode kaart kcvv/i)).toEqual({
      ...none,
      minute: true,
      player: true,
    });
    expect(await fields(/gele kaart teg/i)).toEqual({ ...none, minute: true });
  });

  it("the match name, the score and Ploeg survive a moment switch", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await openTab(user, "Tekst");
    await user.type(
      screen.getByPlaceholderText(/KCVV Elewijt/i),
      "KCVV Elewijt — Rapid Leest",
    );
    await user.type(screen.getByPlaceholderText("2 - 0"), "3 - 1");
    await user.type(screen.getByPlaceholderText("A"), "U15");

    await pickMoment(user, /aftrap/i);
    await pickMoment(user, /rust/i);
    await openTab(user, "Tekst");

    expect(screen.getByPlaceholderText(/KCVV Elewijt/i)).toHaveValue(
      "KCVV Elewijt — Rapid Leest",
    );
    expect(screen.getByPlaceholderText("2 - 0")).toHaveValue("3 - 1");
    expect(screen.getByPlaceholderText("A")).toHaveValue("U15");
  });

  it("the player picker is type-to-search; a pick is marked selected", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await openTab(user, "Tekst");
    const list = screen.getByRole("group", { name: "Spelers" });
    expect(within(list).getAllByRole("button")).toHaveLength(3);

    await user.type(screen.getByLabelText(/zoek speler/i), "jan");

    expect(within(list).getAllByRole("button")).toHaveLength(1);
    const jan = within(list).getByRole("button", { name: /Janssen/ });
    await user.click(jan);
    expect(jan).toHaveAttribute("aria-pressed", "true");
  });

  // ─── The match picker (Inhoud) ───────────────────────────────────────────

  it("the match picker is type-to-search, never a bare dropdown", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await openTab(user, "Inhoud");
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(document.querySelector("datalist, select")).toBeNull();

    await user.type(screen.getByLabelText("Zoek wedstrijd"), "home");

    const list = screen.getByRole("group", { name: "Wedstrijden" });
    expect(within(list).getAllByRole("button")).toHaveLength(1);
    expect(within(list).getByRole("button")).toHaveTextContent(
      MATCHES[1]!.label,
    );
  });

  it("picking a match fills the club-names-only matchup and its short squad, badged in the preview", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await pickMatch(user, MATCHES[0]!);
    expect(
      screen.getByRole("button", { name: MATCHES[0]!.label }),
    ).toHaveAttribute("aria-pressed", "true");
    await openTab(user, "Tekst");

    expect(screen.getByPlaceholderText(/KCVV Elewijt/i)).toHaveValue(
      MATCHES[0]!.matchName,
    );
    expect(screen.getByPlaceholderText("A")).toHaveValue("A");
    expect(within(preview()).getByText("A")).toBeInTheDocument();
  });

  it("picking another known match replaces the badge; clearing Ploeg removes it", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await pickMatch(user, MATCHES[0]!);
    await pickMatch(user, MATCHES[1]!);
    expect(within(preview()).queryByText("A")).toBeNull();
    expect(within(preview()).getByText("B")).toBeInTheDocument();

    await openTab(user, "Tekst");
    await user.clear(screen.getByPlaceholderText("A"));
    expect(within(preview()).queryByText("B")).toBeNull();
  });

  it("picking the second of two matches that share a matchName badges the second squad", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={COLLIDING_MATCHES} players={PLAYERS} />);

    await pickMatch(user, COLLIDING_MATCHES[1]!);
    await openTab(user, "Tekst");

    expect(screen.getByPlaceholderText(/KCVV Elewijt/i)).toHaveValue(
      COLLIDING_MATCHES[1]!.matchName,
    );
    expect(screen.getByPlaceholderText("A")).toHaveValue("U15");
    expect(within(preview()).getByText("U15")).toBeInTheDocument();
  });

  it("typing a known matchup or a squad by hand still reaches the preview", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await openTab(user, "Tekst");

    await user.type(
      screen.getByPlaceholderText(/KCVV Elewijt/i),
      MATCHES[0]!.matchName,
    );
    expect(screen.getByPlaceholderText("A")).toHaveValue("A");

    await user.clear(screen.getByPlaceholderText("A"));
    await user.type(screen.getByPlaceholderText("A"), "U21");
    expect(within(preview()).getByText("U21")).toBeInTheDocument();
  });

  // ─── Eigen foto (Inhoud) ─────────────────────────────────────────────────

  it("A–E have a photo slot on every moment; W only on its image-capable ones", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);

    await pickMoment(user, /goal teg/i);
    expect(screen.getByLabelText(/foto uploaden/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /goal kcvv/i }));
    await pickW(user);
    expect(screen.getByLabelText(/foto uploaden/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /goal teg/i }));
    expect(screen.queryByLabelText(/foto uploaden/i)).toBeNull();
  });

  it("an own photo reaches the preview; Foto weghalen takes it away", async () => {
    const user = userEvent.setup();
    render(<SharePage matches={MATCHES} players={PLAYERS} />);
    await openTab(user, "Inhoud");

    const file = new File(["x"], "goal.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/foto uploaden/i), file);

    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(preview().innerHTML).toContain("blob:");
    await user.click(screen.getByRole("button", { name: "Foto weghalen" }));
    expect(preview().innerHTML).not.toContain("blob:");
    expect(screen.queryByRole("button", { name: "Foto weghalen" })).toBeNull();
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

    it("starts on Wedstrijd with W in the strip; Nieuws swaps in the article picker and the four looks", async () => {
      const user = userEvent.setup();
      renderTool();
      await openTab(user, "Inhoud");

      expect(screen.getByRole("button", { name: "Wedstrijd" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
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
      expect(screen.getByRole("group", { name: "Artikels" })).toBeVisible();
      // Nothing picked yet: no preview, nothing to save.
      expect(screen.queryByTestId("share-preview")).toBeNull();
      expect(saveButton()).toBeDisabled();
      for (const look of ["Kaart", "Plakboek", "Affiche", "Ticket"]) {
        expect(screen.getByRole("button", { name: look })).toBeVisible();
      }
    });

    it("filters the article list as you type", async () => {
      const user = userEvent.setup();
      renderTool();
      await openTab(user, "Inhoud");
      await user.click(screen.getByRole("button", { name: "Nieuws" }));

      await user.type(screen.getByLabelText("Zoek artikel"), "tekent");

      const list = screen.getByRole("group", { name: "Artikels" });
      expect(within(list).getAllByRole("button")).toHaveLength(1);
      expect(within(list).getByRole("button")).toHaveTextContent(
        "Piet tekent bij",
      );
    });

    it("picking an article prefills its title and draws its type, detail and italic accent", async () => {
      const user = userEvent.setup();
      renderTool();
      await openTab(user, "Inhoud");
      await user.click(screen.getByRole("button", { name: "Nieuws" }));
      await user.click(
        screen.getByRole("button", { name: "Jan over zijn eerste seizoen" }),
      );
      await openTab(user, "Tekst");

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

    it("re-tapping the picked article keeps its edits", async () => {
      const user = userEvent.setup();
      renderTool({ kind: "article", item: TRANSFER });
      await openTab(user, "Tekst");
      await user.clear(screen.getByLabelText("Titel"));
      await user.type(screen.getByLabelText("Titel"), "Welkom Piet");

      await openTab(user, "Inhoud");
      await user.click(screen.getByRole("button", { name: TRANSFER.title }));
      await openTab(user, "Tekst");
      expect(screen.getByLabelText("Titel")).toHaveValue("Welkom Piet");
    });

    it("an edited title reaches the preview", async () => {
      const user = userEvent.setup();
      renderTool({ kind: "article", item: TRANSFER });
      await openTab(user, "Tekst");

      const title = screen.getByLabelText("Titel");
      await user.clear(title);
      await user.type(title, "Welkom Piet");

      expect(within(preview()).getByText("Welkom Piet")).toBeInTheDocument();
      expect(within(preview()).getByText("Transfer")).toBeInTheDocument();
      expect(within(preview()).getByText("→ KCVV ELEWIJT")).toBeInTheDocument();
    });

    it("an event shows its type label, the date block and <date · hour> / <location> on two lines", async () => {
      const user = userEvent.setup();
      renderTool({ kind: "event", item: QUIZ });
      await openTab(user, "Tekst");

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

    it("a deep-linked item preselects its mode, even when it is not in the list", async () => {
      const user = userEvent.setup();
      const older: ShareItem = {
        ...TRANSFER,
        slug: "oud",
        title: "Oud nieuws",
        spans: [],
      };
      renderTool({ kind: "article", item: older });
      await openTab(user, "Inhoud");

      expect(screen.getByRole("button", { name: "Nieuws" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(
        screen.getByRole("button", { name: "Oud nieuws" }),
      ).toHaveAttribute("aria-pressed", "true");
      await openTab(user, "Tekst");
      expect(screen.getByLabelText("Titel")).toHaveValue("Oud nieuws");
    });

    it("an unknown deep link opens Inhoud on the empty picker with no preview", () => {
      renderTool({ kind: "event", item: null });

      expect(tabButton("Inhoud")).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("group", { name: "Evenementen" })).toBeVisible();
      expect(screen.queryByTestId("share-preview")).toBeNull();
    });

    it("Omslag starts on Affiche wazig; Foto fills the slot positioned on the hotspot, through the same-origin optimizer", async () => {
      const user = userEvent.setup();
      renderTool({ kind: "article", item: INTERVIEW });
      await openTab(user, "Inhoud");

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

    it("an own photo replaces the cover, and Omslag hides while it is on", async () => {
      const user = userEvent.setup();
      renderTool({ kind: "article", item: INTERVIEW });
      await openTab(user, "Inhoud");

      await user.upload(
        screen.getByLabelText(/foto uploaden/i),
        new File(["x"], "me.png", { type: "image/png" }),
      );

      expect(preview().innerHTML).toContain("blob:");
      expect(
        screen.queryByRole("button", { name: "Affiche wazig" }),
      ).toBeNull();
      await user.click(screen.getByRole("button", { name: "Foto weghalen" }));
      expect(
        screen.getByRole("button", { name: "Affiche wazig" }),
      ).toBeVisible();
    });

    it("an event without a cover draws the event fallback picture and has no Omslag", async () => {
      const user = userEvent.setup();
      renderTool({ kind: "event", item: QUIZ });
      await openTab(user, "Inhoud");

      expect(
        preview().querySelector("img[src='/images/event-fallback.jpg']"),
      ).not.toBeNull();
      // Without a cover every choice would draw the same fallback.
      expect(screen.queryByRole("button", { name: "Reservefoto" })).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Affiche wazig" }),
      ).toBeNull();
    });

    it("Reservefoto swaps the cover for the look's own fallback picture", async () => {
      const user = userEvent.setup();
      renderTool({ kind: "article", item: INTERVIEW });
      await openTab(user, "Inhoud");

      await user.click(screen.getByRole("button", { name: "Reservefoto" }));

      expect(
        preview().querySelector("img[src^='/images/share-fallback/A-']"),
      ).not.toBeNull();
    });

    it("Licht / Donker show for every look, the wash steps for Affiche only, defaulting to Licht + Normaal", async () => {
      const user = userEvent.setup();
      renderTool({ kind: "article", item: INTERVIEW });
      await openTab(user, "Stijl");

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
      await openTab(user, "Inhoud");
      expect(screen.queryByRole("button", { name: "Foto" })).toBeNull();

      await openTab(user, "Stijl");
      expect(screen.getByRole("button", { name: "Licht" })).toBeVisible();
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

      await openTab(user, "Stijl");
      await user.click(screen.getByRole("button", { name: /vierkant/i }));
      await save(user);

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
    const previewHtml = () => preview().innerHTML;
    const pressed = (name: string) =>
      screen.getByRole("button", { name }).getAttribute("aria-pressed");
    const fillMatch = async (user: User) => {
      await pickMatch(user, MATCHES[0]!);
      await openTab(user, "Tekst");
      await user.type(screen.getByPlaceholderText("2 - 0"), "2 - 1");
      await user.type(screen.getByPlaceholderText("45+2"), "67");
    };
    const pickNews = async (user: User, item: ShareItem) => {
      await openTab(user, "Inhoud");
      await user.click(screen.getByRole("button", { name: "Nieuws" }));
      await user.click(screen.getByRole("button", { name: item.title }));
    };

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

      await pickMoment(user, "Rust");
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
      await openTab(user, "Stijl");
      await user.click(screen.getByRole("button", { name: "Donker" }));
      unmount();

      renderTool();
      await openTab(user, "Tekst");
      expect(screen.getByPlaceholderText(/fc tegenstander/i)).toHaveValue(
        MATCHES[0]!.matchName,
      );
      expect(screen.getByPlaceholderText("2 - 0")).toHaveValue("2 - 1");
      expect(screen.getByPlaceholderText("45+2")).toHaveValue("67");
      expect(screen.getByPlaceholderText("A")).toHaveValue("A");
      await openTab(user, "Stijl");
      expect(pressed("Donker")).toBe("true");
    });

    it("a news story's edited fields come back after a reload; another article clears them", async () => {
      const user = userEvent.setup();
      const { unmount } = renderTool();
      await pickNews(user, NEWS);
      await openTab(user, "Tekst");
      await user.clear(screen.getByLabelText("Titel"));
      await user.type(screen.getByLabelText("Titel"), "Kantine open!");
      unmount();

      renderTool();
      await openTab(user, "Tekst");
      expect(screen.getByLabelText("Titel")).toHaveValue("Kantine open!");
      await openTab(user, "Inhoud");
      await user.click(screen.getByRole("button", { name: OTHER_NEWS.title }));
      await openTab(user, "Tekst");
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
      await openTab(user, "Tekst");
      expect(screen.getByPlaceholderText(/fc tegenstander/i)).toHaveValue("");
      expect(pressed("Ticket")).toBe("true");
    });

    it("picking another match clears the last one's score and minute", async () => {
      const user = userEvent.setup();
      renderTool();
      await fillMatch(user);
      await pickMatch(user, MATCHES[1]!);
      await openTab(user, "Tekst");

      expect(screen.getByPlaceholderText("2 - 0")).toHaveValue("");
      expect(screen.getByPlaceholderText("45+2")).toHaveValue("");
    });

    it("re-picking the same match after typing over its name keeps its score", async () => {
      const user = userEvent.setup();
      renderTool();
      await fillMatch(user);
      await user.type(screen.getByPlaceholderText(/fc tegenstander/i), "x");
      await pickMatch(user, MATCHES[0]!);
      await openTab(user, "Tekst");
      expect(screen.getByPlaceholderText("2 - 0")).toHaveValue("2 - 1");
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
      await openTab(user, "Inhoud");
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

      await pickNews(user, NEWS);
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
      await openTab(user, "Inhoud");
      await user.click(screen.getByRole("button", { name: "Evenement" }));
      await user.click(screen.getByRole("button", { name: "Quiz" }));
      await save(user);
      expect(JSON.parse(localStorage.getItem(KEY)!).fallbackNext).toEqual({});
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
      await pickNews(user, COVERED);
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
      preview().querySelector<HTMLElement>(`[data-block="${id}"]`)!;
    const storedBlocks = () =>
      JSON.parse(localStorage.getItem(KEY)!).story.blocks;
    const EMPTY = { story: {}, square: {} };

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
      await openTab(user, "Stijl");
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

    it("a W block keeps its offset when a photo removes a sibling before it", async () => {
      // Full-time: slot 0 is the crest matchup (gone over a photo), slot 1 the kicker.
      seed(
        {
          template: "full-time",
          blocks: { story: { w1: MOVED }, square: {} },
        },
        "wedstrijd",
      );
      const user = userEvent.setup();
      renderTool();
      expect(block("w1").textContent).toBe("Eindstand");
      expect(block("w1").style.translate).toBe("40px -80px");

      await openTab(user, "Inhoud");
      await user.upload(
        screen.getByLabelText(/foto uploaden/i),
        new File(["x"], "me.png", { type: "image/png" }),
      );
      expect(block("w1").textContent).toBe("Eindstand");
      expect(block("w1").style.translate).toBe("40px -80px");
      expect(block("w0")).toBeNull();
    });

    it("Achter puts the last moved block under the pinned parts; Voor back on top", async () => {
      seed();
      const user = userEvent.setup();
      renderTool();
      await openTab(user, "Schik");
      await user.click(screen.getByRole("button", { name: "Achter" }));
      expect(Number(block("tekst").style.zIndex)).toBeLessThan(20);
      expect(storedBlocks().story.tekst.layer).toBe("achter");
      await user.click(screen.getByRole("button", { name: "Voor" }));
      expect(Number(block("tekst").style.zIndex)).toBeGreaterThan(20);
    });

    it("Midden can be switched off", async () => {
      const user = userEvent.setup();
      renderTool();
      await openTab(user, "Schik");
      const midden = screen.getByRole("button", { name: "Midden" });
      expect(midden).toHaveAttribute("aria-pressed", "true");
      await user.click(midden);
      expect(midden).toHaveAttribute("aria-pressed", "false");
    });

    it("Alles terugzetten clears the layout", async () => {
      seed();
      const user = userEvent.setup();
      renderTool();
      await openTab(user, "Schik");
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
      await save(user);
      expect(storedBlocks()).toEqual(EMPTY);
    });

    it("another look clears the layout", async () => {
      seed();
      const user = userEvent.setup();
      renderTool();
      await user.click(screen.getByRole("button", { name: "Ticket" }));
      expect(storedBlocks()).toEqual(EMPTY);
    });

    it("another moment clears the layout", async () => {
      seed();
      const user = userEvent.setup();
      renderTool();
      await pickMoment(user, "Rust");
      expect(storedBlocks()).toEqual(EMPTY);
    });

    it("another item clears the layout", async () => {
      seed({ mode: "article", itemSlug: NEWS.slug });
      const user = userEvent.setup();
      renderTool();
      expect(block("tekst").style.transform).toBe("translate(40px, -80px)");
      await openTab(user, "Inhoud");
      await user.click(screen.getByRole("button", { name: OTHER_NEWS.title }));
      expect(storedBlocks()).toEqual(EMPTY);
    });

    it("another match clears the layout; clearing the name alone does not", async () => {
      seed({ match: { id: MATCHES[0]!.id, name: MATCHES[0]!.matchName } });
      const user = userEvent.setup();
      renderTool();
      await openTab(user, "Tekst");
      await user.clear(screen.getByPlaceholderText(/fc tegenstander/i));
      expect(storedBlocks().story).toEqual({ tekst: MOVED });
      await pickMatch(user, MATCHES[1]!);
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

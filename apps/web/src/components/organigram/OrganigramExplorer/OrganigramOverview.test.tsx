/**
 * OrganigramOverview — ties the on-page chart to the fullscreen explorer (#2054).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganigramOverview } from "./OrganigramOverview";
import { explorerFixture } from "./organigram-explorer.fixture";
import { HubMemberPanel } from "@/components/organigram/HubMemberPanel";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

describe("OrganigramOverview", () => {
  beforeEach(() => {
    // The B2 test mounts <HubMemberPanel>, which writes `?member=` to the URL on
    // open (replaceMemberParams). Reset the URL so that state can't leak into a
    // later test and auto-restore a panel (happy-dom shares one window per file).
    window.history.replaceState(null, "", "/");
  });

  it("opens the explorer focused on a clicked chart node", async () => {
    render(<OrganigramOverview nodes={explorerFixture} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Open TVJO in de verkenner" }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("treeitem")).toHaveTextContent("TVJO");
  });

  it("opens the explorer at the primary node from the toolbar button", async () => {
    render(<OrganigramOverview nodes={explorerFixture} />);
    await userEvent.click(
      screen.getByRole("button", { name: /Blader door het organigram/ }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("treeitem")).toHaveTextContent(
      "Voorzitter",
    );
  });

  it("closes the explorer and returns focus to the trigger on Esc", async () => {
    render(<OrganigramOverview nodes={explorerFixture} />);
    const launcher = screen.getByRole("button", {
      name: /Blader door het organigram/,
    });
    await userEvent.click(launcher);
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(launcher).toHaveFocus();
  });

  it("closes the verkenner when a member panel opens from it (B2 — no stacked dialogs)", async () => {
    render(
      <HubMemberPanel nodes={explorerFixture} responsibilityPaths={[]}>
        <OrganigramOverview nodes={explorerFixture} />
      </HubMemberPanel>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Blader door het organigram/ }),
    );
    // The verkenner dialog (with its tree) is open.
    expect(await screen.findByRole("treeitem")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Contactgegevens" }),
    );
    // The person panel took over and the verkenner collapsed — never two
    // stacked modal dialogs.
    expect(screen.getByTestId("member-detail-panel")).toBeInTheDocument();
    expect(screen.queryByRole("treeitem")).not.toBeInTheDocument();
  });

  it("collapsible: hides the chart behind a disclosure until opened (7o9 · 2)", async () => {
    render(<OrganigramOverview nodes={explorerFixture} collapsible />);
    // Chart (and its toolbar) hidden; only the quiet disclosure shows.
    expect(screen.queryByTestId("volledig-organigram")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", {
        name: /Bekijk het volledige organigram/,
      }),
    );
    expect(screen.getByTestId("volledig-organigram")).toBeInTheDocument();
  });
});

/**
 * OrganigramOverview — ties the on-page chart to the fullscreen explorer (#2054).
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganigramOverview } from "./OrganigramOverview";
import { explorerFixture } from "./organigram-explorer.fixture";

describe("OrganigramOverview", () => {
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

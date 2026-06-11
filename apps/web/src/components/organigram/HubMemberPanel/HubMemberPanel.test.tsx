/**
 * HubMemberPanel integration tests.
 *
 * Covers the wiring layer (the panel itself is unit-tested separately):
 *  - directory click-delegation opens the panel (only `data-member-card` cards)
 *  - `?member=` deep-link restores the panel on mount, incl. a `holder` selection
 *  - closing the panel clears `member`/`holder` from the URL silently
 *  - `organigram_member_clicked` fires on open (hashed selected holder)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HubMemberPanel, useHubMemberPanel } from "./HubMemberPanel";
import { StructureDirectory } from "@/components/organigram/StructureDirectory";
import { staffMembersFixture } from "@/components/organigram/__fixtures__/staff-members.fixture";
import { hashMemberId } from "@/lib/analytics/hash-member-id";

const trackEvent = vi.fn();
vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

// The analytics hook hashes the selected holder's staffMember id; for the
// "president" node that is members[0].id from the fixture.
const presidentHashedId = hashMemberId(
  staffMembersFixture.find((n) => n.id === "president")!.members[0]!.id,
);

function renderHub() {
  return render(
    <HubMemberPanel nodes={staffMembersFixture} responsibilityPaths={[]}>
      <StructureDirectory nodes={staffMembersFixture} interactive />
    </HubMemberPanel>,
  );
}

/** Exercises the context opener the finder's "Toon in structuur →" calls. */
function OpenByIdButton({ nodeId }: { nodeId: string }) {
  const panel = useHubMemberPanel();
  return (
    <button
      type="button"
      onClick={() => panel?.openMemberById(nodeId, { view: "cards" })}
    >
      open-by-id
    </button>
  );
}

function renderHubWithOpener(nodeId: string) {
  return render(
    <HubMemberPanel nodes={staffMembersFixture} responsibilityPaths={[]}>
      <OpenByIdButton nodeId={nodeId} />
    </HubMemberPanel>,
  );
}

beforeEach(() => {
  trackEvent.mockClear();
  window.history.replaceState(null, "", "/hulp");
});

describe("HubMemberPanel", () => {
  it("opens the panel when a directory card is clicked", async () => {
    const user = userEvent.setup();
    renderHub();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Contactgegevens van Jan Voorzitter",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Contactgegevens — Jan Voorzitter" }),
    ).toBeInTheDocument();
  });

  it("fires organigram_member_clicked on open", async () => {
    const user = userEvent.setup();
    renderHub();
    await user.click(
      screen.getByRole("button", {
        name: "Contactgegevens van Jan Voorzitter",
      }),
    );
    expect(trackEvent).toHaveBeenCalledWith(
      "organigram_member_clicked",
      expect.objectContaining({ view: "cards", member_id: presidentHashedId }),
    );
  });

  it("syncs the ?member= deep-link when a card is opened", async () => {
    const user = userEvent.setup();
    renderHub();
    await user.click(
      screen.getByRole("button", {
        name: "Contactgegevens van Jan Voorzitter",
      }),
    );
    expect(new URLSearchParams(window.location.search).get("member")).toBe(
      "president",
    );
  });

  it("restores the panel from a ?member= deep-link on mount", () => {
    window.history.replaceState(null, "", "/hulp?member=president");
    renderHub();
    expect(
      screen.getByRole("dialog", { name: "Contactgegevens — Jan Voorzitter" }),
    ).toBeInTheDocument();
  });

  it("restores the selected holder from the ?holder= param", () => {
    window.history.replaceState(
      null,
      "",
      "/hulp?member=co-treasurers&holder=staff-pm2",
    );
    renderHub();
    expect(
      screen.getByRole("dialog", {
        name: "Contactgegevens — Tom Penningmeester",
      }),
    ).toBeInTheDocument();
  });

  it("re-lands on holder #1 after closing and reopening the same shared card", async () => {
    const user = userEvent.setup();
    renderHub();
    // Open the shared Co-Penningmeester card (Els + Tom), switch to Tom, close.
    await user.click(
      screen.getByRole("button", {
        name: "Contactgegevens — Co-Penningmeester, 2 personen",
      }),
    );
    await user.click(screen.getByRole("tab", { name: /Tom/ }));
    expect(
      screen.getByRole("dialog", {
        name: "Contactgegevens — Tom Penningmeester",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sluiten" }));

    // Reopening the same card lands on holder #1 (Els), not Tom.
    await user.click(
      screen.getByRole("button", {
        name: "Contactgegevens — Co-Penningmeester, 2 personen",
      }),
    );
    expect(
      screen.getByRole("dialog", {
        name: "Contactgegevens — Els Penningmeester",
      }),
    ).toBeInTheDocument();
  });

  it("openMemberById opens the panel for a known node id (finder cross-link path)", async () => {
    const user = userEvent.setup();
    renderHubWithOpener("president");
    await user.click(screen.getByRole("button", { name: "open-by-id" }));
    expect(
      screen.getByRole("dialog", { name: "Contactgegevens — Jan Voorzitter" }),
    ).toBeInTheDocument();
  });

  it("openMemberById is a no-op for an unknown node id", async () => {
    const user = userEvent.setup();
    renderHubWithOpener("does-not-exist");
    await user.click(screen.getByRole("button", { name: "open-by-id" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clears the deep-link params when the panel is closed", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/hulp?member=president");
    renderHub();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sluiten" }));
    const params = new URLSearchParams(window.location.search);
    expect(params.get("member")).toBeNull();
    expect(params.get("holder")).toBeNull();
  });
});

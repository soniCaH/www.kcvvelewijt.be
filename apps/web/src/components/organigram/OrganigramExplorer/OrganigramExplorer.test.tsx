/**
 * OrganigramExplorer unit tests — the fullscreen spotlight (#2054).
 *
 * Covers: open/close gating · root focus + children · deep-link via
 * initialFocusId · click-to-recentre (descend/ascend/breadcrumb) ·
 * count-then-expand fan · sibling cycler · "Volledig profiel" link · Esc close ·
 * a11y roles (dialog/tree/treeitem + live region) · announceFocus copy.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganigramExplorer, announceFocus } from "./OrganigramExplorer";
import { buildSpotlightTree, getSpotlightView } from "./spotlight-tree";
import { explorerFixture } from "./organigram-explorer.fixture";

function open(props: Partial<Parameters<typeof OrganigramExplorer>[0]> = {}) {
  return render(
    <OrganigramExplorer
      nodes={explorerFixture}
      open
      onClose={vi.fn()}
      {...props}
    />,
  );
}

describe("OrganigramExplorer — gating + a11y shell", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <OrganigramExplorer
        nodes={explorerFixture}
        open={false}
        onClose={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("is a labelled modal dialog wrapping a tree, with a polite live region", () => {
    open();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByRole("tree")).toBeInTheDocument();
    expect(screen.getByRole("treeitem")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(dialog.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });
});

describe("OrganigramExplorer — focus + navigation", () => {
  it("opens on the primary top node (Voorzitter), not the thin synthetic root", () => {
    open();
    expect(screen.getByRole("treeitem")).toHaveTextContent("Voorzitter");
  });

  it("can focus the club root (deep-link) — it fans both top lines", () => {
    open({ initialFocusId: "club" });
    expect(screen.getByRole("treeitem")).toHaveTextContent("KCVV Elewijt");
    expect(
      screen.getByRole("button", { name: "Naar Voorzitter" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Naar Gedelegeerd Commissaris" }),
    ).toBeInTheDocument();
  });

  it("deep-links to a node via initialFocusId and shows its reporting-line breadcrumb", () => {
    open({ initialFocusId: "tvjo" });
    const crumb = screen.getByRole("navigation", { name: "Rapporteringslijn" });
    expect(crumb).toHaveTextContent("KCVV Elewijt");
    expect(crumb).toHaveTextContent("Voorzitter");
    expect(crumb).toHaveTextContent("Sportief Verantwoordelijke");
    // aria-current crumb = the focus.
    expect(within(crumb).getByText("TVJO")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("descends when a child is clicked (re-centres)", async () => {
    open({ initialFocusId: "club" });
    await userEvent.click(
      screen.getByRole("button", { name: "Naar Voorzitter" }),
    );
    expect(screen.getByRole("treeitem")).toHaveTextContent("Voorzitter");
  });

  it("does NOT descend when the centred node itself is clicked", async () => {
    open({ initialFocusId: "voorzitter" });
    await userEvent.click(screen.getByRole("treeitem"));
    // The centre is "you are here" — clicking it must not fall through to a child.
    expect(screen.getByRole("treeitem")).toHaveTextContent("Voorzitter");
  });

  it("descends to the first child on ArrowDown", async () => {
    open({ initialFocusId: "voorzitter" });
    screen.getByRole("treeitem").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("treeitem")).toHaveTextContent("Jeugdvoorzitter");
  });

  it("shows the keyboard focus ring only after a keyboard nav, not on open", async () => {
    open({ initialFocusId: "voorzitter" });
    // On open: no keyboard-nav ring.
    expect(screen.getByRole("treeitem")).toHaveAttribute(
      "data-keyboard-nav",
      "false",
    );
    screen.getByRole("treeitem").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("treeitem")).toHaveAttribute(
      "data-keyboard-nav",
      "true",
    );
  });

  it("keeps the ring off when navigating by mouse click", async () => {
    open({ initialFocusId: "voorzitter" });
    await userEvent.click(
      screen.getByRole("button", { name: "Naar Jeugdvoorzitter" }),
    );
    expect(screen.getByRole("treeitem")).toHaveAttribute(
      "data-keyboard-nav",
      "false",
    );
  });

  it("ascends via the parent control", async () => {
    open({ initialFocusId: "tvjo" });
    await userEvent.click(
      screen.getByRole("button", {
        name: "Omhoog naar Sportief Verantwoordelijke",
      }),
    );
    expect(screen.getByRole("treeitem")).toHaveTextContent(
      "Sportief Verantwoordelijke",
    );
  });

  it("jumps to an ancestor via the breadcrumb", async () => {
    open({ initialFocusId: "tvjo" });
    const crumb = screen.getByRole("navigation", { name: "Rapporteringslijn" });
    await userEvent.click(
      within(crumb).getByRole("button", { name: "Voorzitter" }),
    );
    expect(screen.getByRole("treeitem")).toHaveTextContent("Voorzitter");
  });
});

describe("OrganigramExplorer — count-then-expand fan", () => {
  it("caps a wide fan and reveals the rest on '+N meer'", async () => {
    open({ initialFocusId: "tvjo", childrenCap: 7 });
    // TVJO has 12 children → 7 shown + "+5 meer".
    expect(
      screen.getByRole("button", { name: /\+5 meer/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Naar ProSoccerData" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Naar Spelersraad" }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /\+5 meer/ }));
    expect(
      screen.getByRole("button", { name: "Naar Spelersraad" }),
    ).toBeInTheDocument();
  });
});

describe("OrganigramExplorer — siblings + profile", () => {
  it("shows the sibling position indicator and cycles", async () => {
    open({ initialFocusId: "secretaris" }); // sibling of jeugdvoorzitter, penningmeester, …
    expect(screen.getByText(/2 \/ 11/)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Volgende functie" }),
    );
    expect(screen.getByRole("treeitem")).toHaveTextContent("Penningmeester");
  });

  it("links a single-holder centre to its staff profile", () => {
    open({ initialFocusId: "secretaris" });
    expect(
      screen.getByRole("link", { name: /Volledig profiel/ }),
    ).toHaveAttribute("href", "/staf/secretaris");
  });

  it("offers no profile link for a vacant centre", () => {
    open({ initialFocusId: "ouderraad" });
    expect(
      screen.queryByRole("link", { name: /Volledig profiel/ }),
    ).not.toBeInTheDocument();
  });

  it("lists every holder for a shared role (so their names are reachable)", () => {
    open({ initialFocusId: "kledij" }); // 3 personen
    const list = screen.getByRole("list", {
      name: "Personen in deze functie",
    });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });
});

describe("OrganigramExplorer — Esc", () => {
  it("closes on Escape", async () => {
    const onClose = vi.fn();
    open({ onClose });
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("announceFocus", () => {
  const tree = buildSpotlightTree(explorerFixture);

  it("names the node, level, parent, holders and child count in Dutch", () => {
    const msg = announceFocus(getSpotlightView(tree, "sportief"));
    expect(msg).toContain("Sportief Verantwoordelijke");
    expect(msg).toContain("Niveau 2");
    expect(msg).toContain("onder Voorzitter");
    expect(msg).toMatch(/onderliggende functie/);
  });

  it("flags a vacant node", () => {
    expect(announceFocus(getSpotlightView(tree, "ouderraad"))).toContain(
      "deze plek is vrij",
    );
  });

  it("flags a shared node with its count", () => {
    expect(announceFocus(getSpotlightView(tree, "kledij"))).toContain(
      "gedeeld, 3 personen",
    );
  });
});

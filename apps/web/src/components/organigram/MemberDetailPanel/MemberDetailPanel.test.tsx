/**
 * MemberDetailPanel unit tests.
 *
 * Covers the person-first contact panel (7o5 lock):
 *  - single: kicker (afdeling · functie) · person name · roleCode pill ·
 *    ✉ Mail / ☎ Bel only when present · "Volledig profiel" only with href ·
 *    "Helpt met" chips for the holder's responsibilities (auto-hide when none)
 *  - shared: holder-switcher (real role="tablist"/tab) · lands on holder #1 ·
 *    switching updates the rendered person + contact + the dialog name
 *  - vacant: no actions / no chips / no profile · recruit CTA
 *  - a11y: labelled role="dialog" ("Contactgegevens — {name}") · Esc closes ·
 *    closed when open=false or node null
 *  - onMemberShown fires on open (holder #1) and again on each holder switch;
 *    null holder for a vacant position
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemberDetailPanel } from "./MemberDetailPanel";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";

const singleNode: OrgChartNode = {
  id: "president",
  title: "Voorzitter",
  roleCode: "VZ",
  department: "hoofdbestuur",
  members: [
    {
      id: "staff-president",
      name: "Luc Boons",
      email: "voorzitter@kcvvelewijt.be",
      phone: "+32 470 11 22 33",
      href: "/staf/luc-boons",
    },
  ],
};

const sharedNode: OrgChartNode = {
  id: "party-committee",
  title: "Feestcomité",
  department: "jeugdbestuur",
  members: [
    { id: "staff-els", name: "Els Claes", email: "els@kcvvelewijt.be" },
    { id: "staff-nina", name: "Nina Bral", phone: "+32 470 99 88 77" },
    { id: "staff-wout", name: "Wout Verlinden", href: "/staf/wout" },
  ],
};

const vacantNode: OrgChartNode = {
  id: "sponsor-coordinator",
  title: "Sponsorverantwoordelijke",
  roleCode: "SPON",
  department: "hoofdbestuur",
  members: [],
};

function responsibility(
  id: string,
  question: string,
  memberId: string,
  memberName: string,
): ResponsibilityPath {
  return {
    id,
    role: ["niet-lid"],
    question,
    keywords: [],
    summary: `${question}.`,
    steps: [],
    category: "algemeen",
    primaryContact: {
      contactType: "position",
      members: [{ id: memberId, name: memberName }],
    },
  };
}

const responsibilityPaths: ResponsibilityPath[] = [
  responsibility("lid-worden", "Lid worden", "staff-president", "Luc Boons"),
  responsibility("evenement", "Evenement aanvragen", "staff-els", "Els Claes"),
];

const noop = () => {};

describe("MemberDetailPanel", () => {
  describe("closed states", () => {
    it("renders nothing when open is false", () => {
      const { container } = render(
        <MemberDetailPanel node={singleNode} open={false} onClose={noop} />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when node is null", () => {
      const { container } = render(
        <MemberDetailPanel node={null} open={true} onClose={noop} />,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("single holder", () => {
    it("shows the person, the afdeling · functie kicker and the roleCode pill", () => {
      render(<MemberDetailPanel node={singleNode} open onClose={noop} />);
      expect(screen.getByText("Luc Boons")).toBeInTheDocument();
      expect(screen.getByText(/Hoofdbestuur/)).toBeInTheDocument();
      expect(screen.getByText(/Voorzitter/)).toBeInTheDocument();
      expect(screen.getByText("VZ")).toBeInTheDocument();
    });

    it("renders mail + phone actions when present", () => {
      render(<MemberDetailPanel node={singleNode} open onClose={noop} />);
      expect(screen.getByRole("link", { name: /Mail/ })).toHaveAttribute(
        "href",
        "mailto:voorzitter@kcvvelewijt.be",
      );
      expect(screen.getByRole("link", { name: /Bel/ })).toHaveAttribute(
        "href",
        "tel:+32 470 11 22 33",
      );
    });

    it("omits the mail action when there is no email", () => {
      const node: OrgChartNode = {
        ...singleNode,
        members: [{ id: "x", name: "Geen Mail", phone: "+32 1" }],
      };
      render(<MemberDetailPanel node={node} open onClose={noop} />);
      expect(
        screen.queryByRole("link", { name: /Mail/ }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Bel/ })).toBeInTheDocument();
    });

    it("strips control chars + trims contact values, and hides the action when nothing usable remains", () => {
      const { unmount } = render(
        <MemberDetailPanel
          node={{
            ...singleNode,
            members: [
              {
                id: "x",
                name: "Mal Formed",
                email: "ok@kcvvelewijt.be\r\nBcc:evil@x.com",
                phone: "  +32 470 00 00 00  ",
              },
            ],
          }}
          open
          onClose={noop}
        />,
      );
      const mail = screen.getByRole("link", { name: /Mail/ });
      // No CR/LF survives → no mailto header injection.
      expect(mail.getAttribute("href")).not.toMatch(/[\r\n]/);
      expect(mail).toHaveAttribute(
        "href",
        "mailto:ok@kcvvelewijt.beBcc:evil@x.com",
      );
      // Phone is trimmed (internal spaces preserved).
      expect(screen.getByRole("link", { name: /Bel/ })).toHaveAttribute(
        "href",
        "tel:+32 470 00 00 00",
      );
      unmount();

      // A value that is only whitespace/control chars hides the action.
      render(
        <MemberDetailPanel
          node={{
            ...singleNode,
            members: [{ id: "y", name: "Leeg", email: "  \r\n  " }],
          }}
          open
          onClose={noop}
        />,
      );
      expect(
        screen.queryByRole("link", { name: /Mail/ }),
      ).not.toBeInTheDocument();
    });

    it("renders 'Volledig profiel' only when the holder has an href", () => {
      const { unmount } = render(
        <MemberDetailPanel node={singleNode} open onClose={noop} />,
      );
      expect(
        screen.getByRole("link", { name: /Volledig profiel/ }),
      ).toHaveAttribute("href", "/staf/luc-boons");
      unmount();

      const noHref: OrgChartNode = {
        ...singleNode,
        members: [{ id: "x", name: "Geen Profiel" }],
      };
      render(<MemberDetailPanel node={noHref} open onClose={noop} />);
      expect(
        screen.queryByRole("link", { name: /Volledig profiel/ }),
      ).not.toBeInTheDocument();
    });

    it("renders 'Helpt met' chips for the holder's responsibilities and hides when none", () => {
      const { unmount } = render(
        <MemberDetailPanel
          node={singleNode}
          open
          onClose={noop}
          responsibilityPaths={responsibilityPaths}
        />,
      );
      expect(screen.getByText("Helpt met")).toBeInTheDocument();
      // The chip deep-links the question's slug (7o9 / F10) so the finder opens
      // that exact answer in view, not just a scroll to #hulp.
      expect(screen.getByRole("link", { name: "Lid worden" })).toHaveAttribute(
        "href",
        "#lid-worden",
      );
      // Els' responsibility must not leak into Luc's panel.
      expect(
        screen.queryByRole("link", { name: "Evenement aanvragen" }),
      ).not.toBeInTheDocument();
      unmount();

      render(
        <MemberDetailPanel
          node={singleNode}
          open
          onClose={noop}
          responsibilityPaths={[]}
        />,
      );
      expect(screen.queryByText("Helpt met")).not.toBeInTheDocument();
    });

    it("closes the panel when a 'Helpt met' chip is clicked (F10)", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(
        <MemberDetailPanel
          node={singleNode}
          open
          onClose={onClose}
          responsibilityPaths={responsibilityPaths}
        />,
      );
      await user.click(screen.getByRole("link", { name: "Lid worden" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("shared holders", () => {
    it("renders a tablist of holders and lands on holder #1", () => {
      render(<MemberDetailPanel node={sharedNode} open onClose={noop} />);
      const tablist = screen.getByRole("tablist");
      const tabs = within(tablist).getAllByRole("tab");
      expect(tabs).toHaveLength(3);
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      // First holder is shown.
      expect(screen.getByText("Els Claes")).toBeInTheDocument();
    });

    it("switches the rendered holder + contact when another tab is selected", async () => {
      const user = userEvent.setup();
      render(<MemberDetailPanel node={sharedNode} open onClose={noop} />);
      await user.click(screen.getByRole("tab", { name: /Wout/ }));
      expect(screen.getByText("Wout Verlinden")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Wout/ })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      // Wout has only a profile href — no mail/phone actions.
      expect(
        screen.queryByRole("link", { name: /Mail/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Volledig profiel/ }),
      ).toHaveAttribute("href", "/staf/wout");
    });

    it("resets to holder #1 when the shown node is cleared and reopened (host close→reopen)", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <MemberDetailPanel node={sharedNode} open onClose={noop} />,
      );
      await user.click(screen.getByRole("tab", { name: /Wout/ }));
      expect(screen.getByText("Wout Verlinden")).toBeInTheDocument();

      // The host clears `node` on close, then sets it again on reopen.
      rerender(<MemberDetailPanel node={null} open={false} onClose={noop} />);
      rerender(<MemberDetailPanel node={sharedNode} open onClose={noop} />);

      expect(screen.getByRole("tab", { name: /Els/ })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByText("Els Claes")).toBeInTheDocument();
    });

    it("reflects the holder in the dialog accessible name and updates on switch", async () => {
      const user = userEvent.setup();
      render(<MemberDetailPanel node={sharedNode} open onClose={noop} />);
      expect(
        screen.getByRole("dialog", { name: "Contactgegevens — Els Claes" }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("tab", { name: /Nina/ }));
      expect(
        screen.getByRole("dialog", { name: "Contactgegevens — Nina Bral" }),
      ).toBeInTheDocument();
    });
  });

  describe("vacant position", () => {
    it("shows the position, a vacant cue and the recruit CTA — no contact actions", () => {
      render(
        <MemberDetailPanel
          node={vacantNode}
          open
          onClose={noop}
          responsibilityPaths={responsibilityPaths}
          vacantCtaHref="/club/contact"
        />,
      );
      expect(screen.getByText("Sponsorverantwoordelijke")).toBeInTheDocument();
      expect(screen.getByText(/deze plek is vrij/i)).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Iets voor jou/ }),
      ).toHaveAttribute("href", "/club/contact");
      expect(
        screen.queryByRole("link", { name: /Mail/ }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
      expect(screen.queryByText("Helpt met")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /Volledig profiel/ }),
      ).not.toBeInTheDocument();
    });
  });

  describe("a11y", () => {
    it("is a labelled dialog distinct from the verkenner", () => {
      render(<MemberDetailPanel node={singleNode} open onClose={noop} />);
      expect(
        screen.getByRole("dialog", { name: "Contactgegevens — Luc Boons" }),
      ).toBeInTheDocument();
    });

    it("closes on Escape and on the close button", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<MemberDetailPanel node={singleNode} open onClose={onClose} />);
      await user.keyboard("{Escape}");
      expect(onClose).toHaveBeenCalledTimes(1);
      await user.click(screen.getByRole("button", { name: /sluiten/i }));
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });

  describe("onMemberShown", () => {
    it("fires on open with the first holder", () => {
      const onMemberShown = vi.fn();
      render(
        <MemberDetailPanel
          node={singleNode}
          open
          onClose={noop}
          onMemberShown={onMemberShown}
        />,
      );
      expect(onMemberShown).toHaveBeenCalledTimes(1);
      expect(onMemberShown).toHaveBeenLastCalledWith(
        singleNode,
        singleNode.members[0],
      );
    });

    it("fires again with the newly selected holder on switch", async () => {
      const user = userEvent.setup();
      const onMemberShown = vi.fn();
      render(
        <MemberDetailPanel
          node={sharedNode}
          open
          onClose={noop}
          onMemberShown={onMemberShown}
        />,
      );
      onMemberShown.mockClear();
      await user.click(screen.getByRole("tab", { name: /Wout/ }));
      expect(onMemberShown).toHaveBeenLastCalledWith(
        sharedNode,
        sharedNode.members[2],
      );
    });

    it("fires with a null holder for a vacant position", () => {
      const onMemberShown = vi.fn();
      render(
        <MemberDetailPanel
          node={vacantNode}
          open
          onClose={noop}
          onMemberShown={onMemberShown}
        />,
      );
      expect(onMemberShown).toHaveBeenLastCalledWith(vacantNode, null);
    });

    it("restores a specific holder via initialHolderId", () => {
      render(
        <MemberDetailPanel
          node={sharedNode}
          open
          onClose={noop}
          initialHolderId="staff-wout"
        />,
      );
      expect(screen.getByRole("tab", { name: /Wout/ })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });
});

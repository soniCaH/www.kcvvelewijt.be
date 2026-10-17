import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import { hashMemberId } from "@/lib/analytics/hash-member-id";
import { trackEvent } from "@/lib/analytics/track-event";
import { ClubBook } from "./ClubBook";
import { openStructureRow } from "./open-row";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

const secretaris: OrgChartNode = {
  id: "sec",
  title: "Secretaris",
  roleCode: "SEC",
  pillar: "bestuur",
  description: "Post, verslagen, de vzw",
  members: [
    {
      id: "kevin",
      name: "Kevin Van Ransbeeck",
      email: "kevin@kcvv.be",
      href: "/staf/1",
    },
  ],
};

const nodes: OrgChartNode[] = [
  secretaris,
  {
    id: "pen",
    title: "Penningmeester",
    roleCode: "PEN",
    pillar: "bestuur",
    members: [{ id: "koen", name: "Koen" }],
  },
  {
    id: "bst",
    title: "Bestuursorgaan",
    roleCode: "BST",
    pillar: "bestuur",
    members: [
      { id: "kevin", name: "Kevin Van Ransbeeck" },
      { id: "koen", name: "Koen" },
    ],
  },
  {
    id: "gdpr",
    title: "GDPR",
    pillar: "jeugd-organisatie",
    members: [{ id: "shauni", name: "Shauni" }],
  },
  {
    id: "kan",
    title: "Kantinedienst",
    pillar: "jeugd-organisatie",
    members: [
      { id: "shauni", name: "Shauni" },
      { id: "dennis", name: "Dennis" },
    ],
  },
  { id: "sco", title: "Scouting", pillar: "sportief", members: [] },
  { id: "los", title: "Losse functie", members: [{ id: "x", name: "Xavier" }] },
];

const paths: ResponsibilityPath[] = [
  {
    id: "privacy",
    title: "Privacy",
    role: ["ouder"],
    question: "wil mijn gegevens laten wissen",
    keywords: [],
    summary: "",
    steps: [],
    category: "administratief",
    primaryContact: {
      contactType: "position",
      nodeId: "gdpr",
      members: [{ id: "shauni", name: "Shauni" }],
    },
  },
];

const row = (title: string) =>
  screen.getByText(title, { selector: "summary *" }).closest("details");

beforeEach(() => {
  vi.mocked(trackEvent).mockClear();
  vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  // URL and hash state some tests set, reset even when the test failed.
  window.history.replaceState(null, "", "/");
  window.location.hash = "";
});

describe("<ClubBook>", () => {
  it("shows a key figure's why-line and contact without a click", () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    const group = screen.getByRole("region", { name: "Dagelijks bestuur" });
    expect(within(group).getByText("Post, verslagen, de vzw")).toBeVisible();
    // Looked up by href: the address carries <wbr> break opportunities.
    expect(
      group.querySelector('a[href="mailto:kevin@kcvv.be"]'),
    ).not.toBeNull();
  });

  it("lets an email break after the @ and the dots only, never inside a word", () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    const mail = document.querySelector<HTMLElement>(
      'a[href="mailto:kevin@kcvv.be"]',
    );
    if (!mail) throw new Error("mail link missing");
    // Text unchanged for the reader and for copy-paste…
    expect(mail.textContent).toBe("kevin@kcvv.be");
    // …with a break opportunity after "@" and after each ".", and nowhere else.
    expect(mail.innerHTML).toBe("kevin@<wbr>kcvv.<wbr>be");
  });

  it("offers the secretariaat when a holder has no email or phone", () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    const group = screen.getByRole("region", { name: "Dagelijks bestuur" });
    expect(
      within(group).getByRole("link", { name: "het secretariaat" }),
    ).toHaveAttribute("href", "/club/contact");
  });

  it("writes no why-line for a key box whose description is empty", () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    const penningmeester = screen
      .getByRole("heading", { name: "Penningmeester" })
      .closest("li");
    expect(penningmeester?.querySelectorAll("p")).toHaveLength(1); // contact only
  });

  it("names the Raad van bestuur and links the board page", () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    expect(
      screen.getByText(/Raad van bestuur:/).parentElement,
    ).toHaveTextContent("Raad van bestuur: Kevin Van Ransbeeck, Koen");
    expect(
      screen.getByRole("link", { name: /Bekijk het hoofdbestuur/ }),
    ).toHaveAttribute("href", "/club/bestuur");
  });

  it("links the Jeugd pillar to the jeugdbestuur", () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    const jeugd = screen.getByRole("region", { name: "Jeugd" });
    expect(
      within(jeugd).getByRole("link", { name: /Bekijk het jeugdbestuur/ }),
    ).toHaveAttribute("href", "/club/jeugdbestuur");
  });

  it("lists a box with no pillar under Overige functies", () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    const overige = screen.getByRole("region", { name: "Overige functies" });
    expect(within(overige).getByText("Losse functie")).toBeInTheDocument();
  });

  it("links a vacant row to the contact page from the row itself, with nothing to unfold", () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    const sportief = screen.getByRole("region", { name: "Sportief" });
    expect(
      within(sportief).getByRole("link", {
        name: "plek vrij — iets voor jou?",
      }),
    ).toHaveAttribute("href", "/club/contact");
    expect(
      within(sportief).queryByText("Scouting", { selector: "summary *" }),
    ).toBeNull();
  });

  it("brings a vacant row into focus when something points at its box", () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    expect(openStructureRow("sco")).toBe(true);
    expect(document.activeElement).toHaveTextContent("Scouting");
  });

  it("starts every row closed and shows vacant rows as an invitation", () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    expect(document.querySelectorAll("details[open]")).toHaveLength(0);
    const sportief = screen.getByRole("region", { name: "Sportief" });
    expect(
      within(sportief).getByText("plek vrij — iets voor jou?"),
    ).toBeInTheDocument();
  });

  it("unfolds a row in place with the holder's card and the questions answered in that role", async () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    await userEvent.click(screen.getByText("GDPR", { selector: "summary *" }));

    const opened = row("GDPR");
    expect(opened).toHaveProperty("open", true);
    const card = within(opened as HTMLElement);
    expect(card.getByText("Hier kan je terecht voor")).toBeInTheDocument();
    expect(
      card.getByRole("link", { name: "Ik wil mijn gegevens laten wissen" }),
    ).toHaveAttribute("href", "#privacy");
  });

  it("keeps a question off the other row of the same person", async () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    await userEvent.click(
      screen.getByText("Kantinedienst", { selector: "summary *" }),
    );

    const opened = within(row("Kantinedienst") as HTMLElement);
    expect(opened.getAllByText("Contact via")).toHaveLength(2); // one card per holder
    expect(opened.queryByText("Hier kan je terecht voor")).toBeNull();
  });

  it("fires the member event once per opening, for a click and for the shared open action alike", async () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    await userEvent.click(screen.getByText("GDPR", { selector: "summary *" }));
    await waitFor(() => expect(trackEvent).toHaveBeenCalledTimes(1));
    expect(trackEvent).toHaveBeenLastCalledWith("organigram_member_clicked", {
      member_id: hashMemberId("shauni"),
      view: "cards",
    });

    openStructureRow("kan");
    await waitFor(() => expect(trackEvent).toHaveBeenCalledTimes(2));
    expect(trackEvent).toHaveBeenLastCalledWith("organigram_member_clicked", {
      member_id: hashMemberId("shauni"),
      view: "cards",
    });

    // Closing a row is not an event.
    await userEvent.click(screen.getByText("GDPR", { selector: "summary *" }));
    await waitFor(() => expect(row("GDPR")).toHaveProperty("open", false));
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it("focuses the key-figure card for a board box that has no ledger row", () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    expect(openStructureRow("sec")).toBe(true);
    expect(document.activeElement).toHaveAttribute("data-key-node-id", "sec");
  });

  it("fires the member event for a key-figure card too, since nothing toggles", () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    openStructureRow("sec");

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenLastCalledWith("organigram_member_clicked", {
      member_id: hashMemberId("kevin"),
      view: "cards",
    });
  });

  it("carries the view of an open that came from the explorer", async () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    openStructureRow("gdpr", "chart");

    await waitFor(() => expect(trackEvent).toHaveBeenCalledTimes(1));
    expect(trackEvent).toHaveBeenLastCalledWith("organigram_member_clicked", {
      member_id: hashMemberId("shauni"),
      view: "chart",
    });
    // The hint does not outlive that open: a later click is a "cards" open.
    await userEvent.click(screen.getByText("GDPR", { selector: "summary *" }));
    await userEvent.click(screen.getByText("GDPR", { selector: "summary *" }));
    await waitFor(() => expect(trackEvent).toHaveBeenCalledTimes(2));
    expect(trackEvent).toHaveBeenLastCalledWith("organigram_member_clicked", {
      member_id: hashMemberId("shauni"),
      view: "cards",
    });
  });

  it("gives the Raad van bestuur line as the target of the Bestuursorgaan box", () => {
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    expect(openStructureRow("bst")).toBe(true);
    expect(document.activeElement).toHaveTextContent("Raad van bestuur:");
  });

  it("reveals a question again when its hash is already in the URL", async () => {
    window.location.hash = "privacy";
    const onHashChange = vi.fn();
    window.addEventListener("hashchange", onHashChange);
    onTestFinished(() =>
      window.removeEventListener("hashchange", onHashChange),
    );
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);
    await userEvent.click(screen.getByText("GDPR", { selector: "summary *" }));
    onHashChange.mockClear();

    await userEvent.click(
      screen.getByRole("link", { name: "Ik wil mijn gegevens laten wissen" }),
    );

    expect(onHashChange).toHaveBeenCalled();
  });

  it("opens the row a ?member= link points at on arrival, and counts that open once", async () => {
    window.history.replaceState(null, "", "/hulp?member=gdpr");
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);

    await waitFor(() => expect(row("GDPR")).toHaveProperty("open", true));
    await waitFor(() => expect(trackEvent).toHaveBeenCalledTimes(1));
    expect(trackEvent).toHaveBeenLastCalledWith("organigram_member_clicked", {
      member_id: hashMemberId("shauni"),
      view: "cards",
    });
  });

  it("does nothing, and throws nothing, for a ?member= id that matches no row", async () => {
    window.history.replaceState(null, "", "/hulp?member=does-not-exist");
    render(<ClubBook nodes={nodes} responsibilityPaths={paths} />);
    // Let the arrival effect run.
    await Promise.resolve();

    expect(document.querySelectorAll("details[open]")).toHaveLength(0);
    expect(trackEvent).not.toHaveBeenCalled();
  });
});

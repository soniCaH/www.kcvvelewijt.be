import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

import { trackEvent } from "@/lib/analytics/track-event";
import { hashMemberId } from "@/lib/analytics/hash-member-id";
import { TeamSponsorLine } from "./TeamSponsorLine";

const garage = { id: "s-1", name: "Garage X", url: "https://garagex.example" };
const bakker = {
  id: "s-2",
  name: "Bakkerij Y",
  url: "https://bakkerij.example",
};
const slager = { id: "s-3", name: "Slagerij Z", url: undefined };

describe("TeamSponsorLine", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing for an empty list", () => {
    const { container } = render(
      <TeamSponsorLine sponsors={[]} teamSlug="u15" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    [[garage], "Gesteund door Garage X"],
    [[garage, bakker], "Gesteund door Garage X en Bakkerij Y"],
    [
      [garage, bakker, slager],
      "Gesteund door Garage X, Bakkerij Y en Slagerij Z",
    ],
  ])("joins %j into one sentence", (sponsors, text) => {
    render(<TeamSponsorLine sponsors={sponsors} teamSlug="u15" />);
    // The link's screen-reader-only "(opent in een nieuw tabblad)" is not part of the sentence.
    const sentence = screen
      .getByTestId("team-sponsor-line")
      .textContent!.replaceAll(" (opent in een nieuw tabblad)", "");
    expect(sentence).toBe(text);
  });

  it("links a name with a url in a new tab and keeps the visible name in the accessible name", () => {
    render(<TeamSponsorLine sponsors={[garage]} teamSlug="u15" />);
    const link = screen.getByRole("link", { name: /Garage X/ });
    expect(link).toHaveAttribute("href", "https://garagex.example");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).toHaveAccessibleName("Garage X (opent in een nieuw tabblad)");
  });

  it("leaves a name without a url as plain text", () => {
    render(<TeamSponsorLine sponsors={[slager]} teamSlug="u15" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByTestId("team-sponsor-line")).toHaveTextContent(
      "Gesteund door Slagerij Z",
    );
  });

  it("sends sponsor_team_line_click with the hashed id and the team slug", async () => {
    render(<TeamSponsorLine sponsors={[garage, slager]} teamSlug="u15" />);
    const link = screen.getByRole("link", { name: /Garage X/ });
    link.addEventListener("click", (e) => e.preventDefault());
    await userEvent.click(link);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("sponsor_team_line_click", {
      sponsor_id: hashMemberId("s-1"),
      team_slug: "u15",
    });
  });

  it("sends nothing for a click on the plain-text name", async () => {
    render(<TeamSponsorLine sponsors={[slager]} teamSlug="u15" />);
    await userEvent.click(screen.getByTestId("team-sponsor-line"));
    expect(trackEvent).not.toHaveBeenCalled();
  });
});

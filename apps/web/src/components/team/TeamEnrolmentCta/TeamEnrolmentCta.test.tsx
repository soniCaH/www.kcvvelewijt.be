/**
 * TeamEnrolmentCta unit tests.
 *
 * Covers:
 *  - Youth → renders, heading + CTA link to /club/word-lid
 *  - Senior → renders null
 *  - Youth without an age group → still renders (jersey just has no letter)
 *  - Click → fires team_enrolment_cta_click with the team_slug param
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ComponentProps } from "react";
import { TeamEnrolmentCta } from "./TeamEnrolmentCta";
import { trackEvent } from "@/lib/analytics/track-event";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

// next/link's click navigates via the App Router, which has no provider in the
// unit-test env. Swap it for a plain anchor so we can assert the click handler
// (analytics) without mounting a router. forwardRef avoids the "function
// components cannot be given refs" warning from LinkButton's forwarded ref.
vi.mock("next/link", async () => {
  const { forwardRef } = await import("react");
  return {
    default: forwardRef<HTMLAnchorElement, ComponentProps<"a">>(
      function MockNextLink({ children, ...props }, ref) {
        return (
          <a ref={ref} {...props}>
            {children}
          </a>
        );
      },
    ),
  };
});

describe("TeamEnrolmentCta", () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
  });

  it("renders the youth CTA linking to the static /club/word-lid route", () => {
    render(
      <TeamEnrolmentCta
        teamType="youth"
        teamSlug="kcvv-elewijt-u13"
        ageGroup="U13"
      />,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      /sluit je aan bij de jeugd van elewijt/i,
    );
    const link = screen.getByRole("link", { name: "Word lid" });
    expect(link).toHaveAttribute("href", "/club/word-lid");
  });

  it("returns null for a senior team", () => {
    const { container } = render(
      <TeamEnrolmentCta teamType="senior" teamSlug="kcvv-elewijt-a" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("still renders for a youth team without an age group", () => {
    render(<TeamEnrolmentCta teamType="youth" teamSlug="kcvv-elewijt-jeugd" />);
    expect(screen.getByRole("link", { name: "Word lid" })).toHaveAttribute(
      "href",
      "/club/word-lid",
    );
  });

  it("fires team_enrolment_cta_click with the team slug on click", () => {
    render(
      <TeamEnrolmentCta
        teamType="youth"
        teamSlug="kcvv-elewijt-u13"
        ageGroup="U13"
      />,
    );
    fireEvent.click(screen.getByRole("link", { name: "Word lid" }));
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("team_enrolment_cta_click", {
      team_slug: "kcvv-elewijt-u13",
    });
  });
});

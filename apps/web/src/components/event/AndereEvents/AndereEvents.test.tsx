import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { EventVM } from "@/lib/repositories/event.repository";
import { AndereEvents } from "./AndereEvents";

const event = (over: Partial<EventVM> = {}): EventVM => ({
  id: "e1",
  title: "Spaghetti-avond",
  slug: "spaghetti-avond",
  eventType: "Clubevent",
  dateStart: "2026-09-12T16:00:00Z",
  dateEnd: null,
  location: "Kantine",
  href: "#",
  featuredOnHome: false,
  coverImageUrl: null,
  ...over,
});

describe("AndereEvents", () => {
  it("renders nothing when there are no other events", () => {
    const { container } = render(<AndereEvents events={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the heading and a ticket per event linking to its detail route", () => {
    render(
      <AndereEvents
        events={[
          event({
            id: "e1",
            slug: "spaghetti-avond",
            title: "Spaghetti-avond",
          }),
          event({ id: "e2", slug: "jeugdkamp", title: "Jeugdkamp" }),
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /Andere evenementen/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Spaghetti-avond")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Jeugdkamp/i });
    expect(link).toHaveAttribute("href", "/evenementen/jeugdkamp");
  });
});

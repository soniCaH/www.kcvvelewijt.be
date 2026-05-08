// apps/web/src/components/home/FeaturedEventBand/FeaturedEventBand.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateTime } from "luxon";
import type { ImageProps } from "next/image";
import { FeaturedEventBand } from "./FeaturedEventBand";
import type { FeaturedEventBandEvent } from "./FeaturedEventBand";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

const NOW = DateTime.fromISO("2026-04-20T12:00:00.000Z");

const event: FeaturedEventBandEvent = {
  title: "Sponsorfeest 2026",
  slug: "sponsorfeest-2026",
  dateStart: "2026-04-26T19:00:00.000Z",
  coverImage: {
    url: "https://example.com/cover.jpg",
    alt: "Sponsorfeest cover",
  },
  externalLink: {
    url: "https://tickets.example.com",
    label: "Bestel tickets",
  },
  location: "Kantine",
};

describe("FeaturedEventBand", () => {
  describe("Drop-if-empty", () => {
    it("returns null when event is null", () => {
      const { container } = render(
        <FeaturedEventBand event={null} now={NOW} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("returns null when coverImage is missing", () => {
      const { container } = render(
        <FeaturedEventBand event={{ ...event, coverImage: null }} now={NOW} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("returns null when dateStart is in the past", () => {
      const { container } = render(
        <FeaturedEventBand
          event={{ ...event, dateStart: "2025-01-01T10:00:00.000Z" }}
          now={NOW}
        />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("returns null when dateStart is invalid", () => {
      const { container } = render(
        <FeaturedEventBand
          event={{ ...event, dateStart: "not-a-date" }}
          now={NOW}
        />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Render", () => {
    it("renders the meta line", () => {
      render(<FeaturedEventBand event={event} now={NOW} />);
      expect(screen.getByText("AANSTAAND EVENEMENT")).toBeInTheDocument();
    });

    it("renders the title via h2", () => {
      render(<FeaturedEventBand event={event} now={NOW} />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.textContent).toContain("Sponsorfeest 2026");
    });

    it("renders the cover image with alt text", () => {
      render(<FeaturedEventBand event={event} now={NOW} />);
      const img = screen.getByAltText("Sponsorfeest cover");
      expect(img).toBeInTheDocument();
    });

    it("falls back to 'Kantine' when location is missing", () => {
      render(
        <FeaturedEventBand event={{ ...event, location: null }} now={NOW} />,
      );
      expect(screen.getByText(/Kantine/)).toBeInTheDocument();
    });
  });

  describe("CTA", () => {
    it("renders the external link CTA when externalLink is set", () => {
      render(<FeaturedEventBand event={event} now={NOW} />);
      const cta = screen.getByRole("link", { name: /Bestel tickets/i });
      expect(cta).toHaveAttribute("href", "https://tickets.example.com");
      expect(cta).toHaveAttribute("target", "_blank");
      expect(cta).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("falls back to internal /evenementen/{slug} when externalLink is null", () => {
      render(
        <FeaturedEventBand
          event={{ ...event, externalLink: null }}
          now={NOW}
        />,
      );
      const cta = screen.getByRole("link", { name: /Meer info/i });
      expect(cta).toHaveAttribute("href", "/evenementen/sponsorfeest-2026");
      expect(cta).not.toHaveAttribute("target");
    });

    it("uses externalLink.url with default label when label is missing", () => {
      render(
        <FeaturedEventBand
          event={{
            ...event,
            externalLink: { url: "https://example.com", label: null },
          }}
          now={NOW}
        />,
      );
      const cta = screen.getByRole("link", { name: /Meer info/i });
      expect(cta).toHaveAttribute("href", "https://example.com");
    });
  });

  describe("Date formatting", () => {
    // Test datetimes use explicit Europe/Brussels offsets so the assertions
    // are stable regardless of the test runner's local TZ. The component
    // pins formatting to Europe/Brussels.
    it("renders single-day with time when dateStart has non-midnight time", () => {
      render(<FeaturedEventBand event={event} now={NOW} />);
      // 2026-04-26T19:00Z → 21:00 in CEST.
      const whenLine = screen.getByText(/26 apr/);
      expect(whenLine.textContent).toMatch(/21:00/);
    });

    it("renders multi-day range when dateEnd is on a different day", () => {
      render(
        <FeaturedEventBand
          event={{
            ...event,
            dateStart: "2026-07-06T08:00:00.000Z", // 10:00 CEST
            dateEnd: "2026-07-10T15:00:00.000Z", //   17:00 CEST
          }}
          now={NOW}
        />,
      );
      const text = screen.getByText(/jul/);
      expect(text.textContent).toMatch(/6 jul.*10:00.*10 jul.*17:00/);
    });

    it("renders date-only when dateStart is at midnight (Europe/Brussels)", () => {
      render(
        <FeaturedEventBand
          event={{ ...event, dateStart: "2026-04-25T22:00:00.000Z" }} // 00:00 CEST 26 apr
          now={NOW}
        />,
      );
      const text = screen.getByText(/26 apr/);
      expect(text.textContent).not.toMatch(/00:00/);
    });
  });
});

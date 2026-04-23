import { describe, it, expect } from "vitest";
import type { PortableTextBlock } from "@portabletext/react";
import {
  buildAboutFromSubject,
  buildEventJsonLdInput,
  type ArticleForSeo,
} from "./article-jsonld";

const SHARE_URL = "https://www.kcvvelewijt.be/nieuws/x";

const baseArticle: ArticleForSeo = { title: "Default title" };

describe("buildAboutFromSubject", () => {
  it("returns undefined for non-interview articles", () => {
    const result = buildAboutFromSubject({
      ...baseArticle,
      articleType: "event",
      subject: {
        kind: "player",
        playerRef: { firstName: "Jan", lastName: "Janssen" },
      },
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when subject is null", () => {
    expect(
      buildAboutFromSubject({
        ...baseArticle,
        articleType: "interview",
        subject: null,
      }),
    ).toBeUndefined();
  });

  it("returns undefined when subject.kind is null", () => {
    expect(
      buildAboutFromSubject({
        ...baseArticle,
        articleType: "interview",
        subject: { kind: null },
      }),
    ).toBeUndefined();
  });

  describe("player", () => {
    it("builds Person with psdId URL, position, and transparentImage", () => {
      const result = buildAboutFromSubject({
        ...baseArticle,
        articleType: "interview",
        subject: {
          kind: "player",
          playerRef: {
            firstName: "Jan",
            lastName: "Janssen",
            psdId: "123",
            position: "Keeper",
            transparentImageUrl: "https://cdn/jan-transparent.webp",
            psdImageUrl: "https://cdn/jan-psd.webp",
          },
        },
      });
      expect(result).toEqual({
        name: "Jan Janssen",
        url: "https://www.kcvvelewijt.be/spelers/123",
        image: "https://cdn/jan-transparent.webp",
        jobTitle: "Keeper",
      });
    });

    it("falls back to psdImage when transparentImage is absent", () => {
      const result = buildAboutFromSubject({
        ...baseArticle,
        articleType: "interview",
        subject: {
          kind: "player",
          playerRef: {
            firstName: "A",
            lastName: "B",
            psdImageUrl: "https://cdn/b.webp",
          },
        },
      });
      expect(result?.image).toBe("https://cdn/b.webp");
    });

    it("omits url when psdId is absent", () => {
      const result = buildAboutFromSubject({
        ...baseArticle,
        articleType: "interview",
        subject: {
          kind: "player",
          playerRef: { firstName: "A", lastName: "B" },
        },
      });
      expect(result?.name).toBe("A B");
      expect(result?.url).toBeUndefined();
    });

    it("returns undefined when playerRef is null (player deleted)", () => {
      expect(
        buildAboutFromSubject({
          ...baseArticle,
          articleType: "interview",
          subject: { kind: "player", playerRef: null },
        }),
      ).toBeUndefined();
    });

    it("returns undefined when name cannot be derived", () => {
      expect(
        buildAboutFromSubject({
          ...baseArticle,
          articleType: "interview",
          subject: {
            kind: "player",
            playerRef: { firstName: null, lastName: null },
          },
        }),
      ).toBeUndefined();
    });
  });

  describe("staff", () => {
    it("builds Person without url for staff subjects", () => {
      const result = buildAboutFromSubject({
        ...baseArticle,
        articleType: "interview",
        subject: {
          kind: "staff",
          staffRef: {
            firstName: "Piet",
            lastName: "Pieters",
            functionTitle: "Jeugdcoördinator",
            photoUrl: "https://cdn/piet.webp",
          },
        },
      });
      expect(result).toEqual({
        name: "Piet Pieters",
        image: "https://cdn/piet.webp",
        jobTitle: "Jeugdcoördinator",
      });
      expect(result).not.toHaveProperty("url");
    });

    it("returns undefined when staffRef is null", () => {
      expect(
        buildAboutFromSubject({
          ...baseArticle,
          articleType: "interview",
          subject: { kind: "staff", staffRef: null },
        }),
      ).toBeUndefined();
    });
  });

  describe("custom", () => {
    it("builds Person from customName + customRole + customPhotoUrl", () => {
      const result = buildAboutFromSubject({
        ...baseArticle,
        articleType: "interview",
        subject: {
          kind: "custom",
          customName: "Ann Externe",
          customRole: "Gastspreker",
          customPhotoUrl: "https://cdn/ann.webp",
        },
      });
      expect(result).toEqual({
        name: "Ann Externe",
        image: "https://cdn/ann.webp",
        jobTitle: "Gastspreker",
      });
    });

    it("returns undefined when customName is empty after trim", () => {
      expect(
        buildAboutFromSubject({
          ...baseArticle,
          articleType: "interview",
          subject: { kind: "custom", customName: "   " },
        }),
      ).toBeUndefined();
    });
  });

  it("returns undefined for unknown subject.kind (prevents silent fallthrough)", () => {
    const result = buildAboutFromSubject({
      ...baseArticle,
      articleType: "interview",
      // Cast past the union to simulate a future kind we haven't added yet.
      subject: { kind: "team" as unknown as "custom" },
    });
    expect(result).toBeUndefined();
  });
});

describe("buildEventJsonLdInput", () => {
  const eventFact = (
    overrides: Partial<{
      title: string;
      date: string;
      endDate: string;
      startTime: string;
      endTime: string;
      location: string;
      address: string;
    }>,
  ): PortableTextBlock & { _type: "eventFact" } =>
    ({
      _type: "eventFact",
      _key: "evt-1",
      ...overrides,
    }) as unknown as PortableTextBlock & { _type: "eventFact" };

  it("returns undefined for non-event articles", () => {
    expect(
      buildEventJsonLdInput(
        {
          ...baseArticle,
          articleType: "announcement",
          body: [eventFact({ date: "2026-04-27" })],
        },
        SHARE_URL,
      ),
    ).toBeUndefined();
  });

  it("returns undefined when body is null", () => {
    expect(
      buildEventJsonLdInput(
        { ...baseArticle, articleType: "event", body: null },
        SHARE_URL,
      ),
    ).toBeUndefined();
  });

  it("returns undefined when no eventFact block in body", () => {
    expect(
      buildEventJsonLdInput(
        {
          ...baseArticle,
          articleType: "event",
          body: [{ _type: "block", _key: "1" } as PortableTextBlock],
        },
        SHARE_URL,
      ),
    ).toBeUndefined();
  });

  it("returns undefined when eventFact has no date", () => {
    expect(
      buildEventJsonLdInput(
        {
          ...baseArticle,
          articleType: "event",
          body: [eventFact({ title: "X" })],
        },
        SHARE_URL,
      ),
    ).toBeUndefined();
  });

  it("builds minimal input for date-only event", () => {
    const result = buildEventJsonLdInput(
      {
        title: "Article Title",
        articleType: "event",
        body: [eventFact({ date: "2026-04-27" })],
      },
      SHARE_URL,
    );
    expect(result).toEqual({
      name: "Article Title",
      startDate: "2026-04-27",
      endDate: undefined,
      location: undefined,
      address: undefined,
      url: SHARE_URL,
      image: undefined,
    });
  });

  it("combines date + startTime into a local-floating ISO", () => {
    const result = buildEventJsonLdInput(
      {
        ...baseArticle,
        articleType: "event",
        body: [eventFact({ date: "2026-04-27", startTime: "10:00" })],
      },
      SHARE_URL,
    );
    expect(result?.startDate).toBe("2026-04-27T10:00:00");
  });

  it("omits endDate when neither endDate nor endTime is set", () => {
    const result = buildEventJsonLdInput(
      {
        ...baseArticle,
        articleType: "event",
        body: [eventFact({ date: "2026-04-27", startTime: "10:00" })],
      },
      SHARE_URL,
    );
    expect(result?.endDate).toBeUndefined();
  });

  it("combines endDate + endTime when both are set", () => {
    const result = buildEventJsonLdInput(
      {
        ...baseArticle,
        articleType: "event",
        body: [
          eventFact({
            date: "2026-04-27",
            startTime: "10:00",
            endDate: "2026-04-29",
            endTime: "17:00",
          }),
        ],
      },
      SHARE_URL,
    );
    expect(result?.endDate).toBe("2026-04-29T17:00:00");
  });

  it("uses ev.date when only endTime is set (same-day timed event)", () => {
    const result = buildEventJsonLdInput(
      {
        ...baseArticle,
        articleType: "event",
        body: [
          eventFact({
            date: "2026-04-27",
            startTime: "10:00",
            endTime: "17:00",
          }),
        ],
      },
      SHARE_URL,
    );
    expect(result?.endDate).toBe("2026-04-27T17:00:00");
  });

  it("falls back to article.title when eventFact title is empty", () => {
    const result = buildEventJsonLdInput(
      {
        title: "Fallback Title",
        articleType: "event",
        body: [eventFact({ title: "   ", date: "2026-04-27" })],
      },
      SHARE_URL,
    );
    expect(result?.name).toBe("Fallback Title");
  });

  it("prefers eventFact title when set", () => {
    const result = buildEventJsonLdInput(
      {
        title: "Article Title",
        articleType: "event",
        body: [eventFact({ title: "Event Title", date: "2026-04-27" })],
      },
      SHARE_URL,
    );
    expect(result?.name).toBe("Event Title");
  });

  it("forwards location + address when set", () => {
    const result = buildEventJsonLdInput(
      {
        ...baseArticle,
        articleType: "event",
        body: [
          eventFact({
            date: "2026-04-27",
            location: "Sportpark Elewijt",
            address: "Driesstraat 39, 1982 Elewijt",
          }),
        ],
      },
      SHARE_URL,
    );
    expect(result?.location).toBe("Sportpark Elewijt");
    expect(result?.address).toBe("Driesstraat 39, 1982 Elewijt");
  });
});

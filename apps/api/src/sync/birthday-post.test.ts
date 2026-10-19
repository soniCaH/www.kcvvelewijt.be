import { afterEach, describe, expect, it, vi } from "vitest";
import { Effect, Layer } from "effect";
import { SanityProjection, type BirthdayPerson } from "../sanity/projection";
import { makeSanityProjectionStub } from "../test-helpers/sanity-projection-stub";
import { makeTestEnvLayer } from "../test-helpers/env-layer";
import {
  birthdaysOn,
  brusselsDate,
  buildBirthdayMessages,
  runBirthdayPost,
  weekOf,
} from "./birthday-post";

const WEBHOOK = "https://hooks.slack.test/abc";
const person = (
  name: string,
  birthDate: string,
  label: string | null = "U15",
): BirthdayPerson => ({ name, birthDate, label });

describe("brusselsDate", () => {
  it("uses the Belgian calendar day, not UTC", () => {
    // 23:30 UTC on 18 Oct is already 19 Oct in Brussels (CEST, UTC+2).
    expect(brusselsDate(new Date("2026-10-18T23:30:00Z"))).toBe("2026-10-19");
    expect(brusselsDate(new Date("2026-10-19T07:00:00Z"))).toBe("2026-10-19");
  });
});

describe("weekOf", () => {
  it("runs Monday through Sunday", () => {
    const monday = weekOf("2026-10-19");
    expect(monday[0]).toBe("2026-10-19");
    expect(monday[6]).toBe("2026-10-25");
    // A Sunday belongs to the week that ended on it.
    expect(weekOf("2026-10-25")).toEqual(monday);
  });

  it("crosses a month boundary", () => {
    expect(weekOf("2026-10-28")).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });
});

describe("birthdaysOn", () => {
  it("matches month and day and computes the age they turn", () => {
    const result = birthdaysOn(
      [person("An", "2012-10-19"), person("Bo", "2012-10-20")],
      "2026-10-19",
    );
    expect(result.map((b) => [b.person.name, b.age])).toEqual([["An", 14]]);
  });

  it("celebrates 29 February on 28 February in a non-leap year", () => {
    const leapling = [person("Lea", "2012-02-29")];
    expect(birthdaysOn(leapling, "2027-02-28")).toHaveLength(1);
    expect(birthdaysOn(leapling, "2027-03-01")).toHaveLength(0);
  });

  it("celebrates 29 February on the day itself in a leap year", () => {
    const leapling = [person("Lea", "2012-02-29")];
    expect(birthdaysOn(leapling, "2028-02-29")).toHaveLength(1);
    expect(birthdaysOn(leapling, "2028-02-28")).toHaveLength(0);
  });

  it("skips malformed dates and people not yet born", () => {
    expect(
      birthdaysOn(
        [person("X", "garbage"), person("Y", "2026-10-19")],
        "2026-10-19",
      ),
    ).toEqual([]);
  });
});

describe("buildBirthdayMessages", () => {
  const people = [
    person("An Smet", "2012-10-19", "U15"),
    person("Marc Peeters", "1975-10-22", null),
    person("Zoë <b>", "2010-10-19", "U17 & co"),
  ];

  it("posts today's list on a quiet Thursday", () => {
    const messages = buildBirthdayMessages(people, "2026-10-22");
    expect(messages).toEqual([
      ":birthday: *Vandaag jarig*\n• Marc Peeters wordt 51",
    ]);
  });

  it("adds the Monday week list after today's", () => {
    const messages = buildBirthdayMessages(people, "2026-10-19");
    expect(messages).toHaveLength(2);
    expect(messages[0]).toBe(
      ":birthday: *Vandaag jarig*\n• An Smet (U15) wordt 14\n• Zoë &lt;b&gt; (U17 &amp; co) wordt 16",
    );
    expect(messages[1]).toContain(":calendar: *Verjaardagen deze week*");
    expect(messages[1]).toContain(
      "• An Smet (U15) wordt 14 — maandag 19 oktober",
    );
    expect(messages[1]).toContain(
      "• Marc Peeters wordt 51 — donderdag 22 oktober",
    );
  });

  it("posts nothing on an empty day, Monday included", () => {
    expect(buildBirthdayMessages(people, "2026-11-02")).toEqual([]);
  });
});

describe("runBirthdayPost", () => {
  afterEach(() => vi.unstubAllGlobals());

  const run = (webhook: string | undefined, now: string) => {
    const getBirthdayPeople = vi.fn(() =>
      Effect.succeed([person("An Smet", "2012-10-22", "U15")]),
    );
    const promise = Effect.runPromise(
      Effect.either(
        runBirthdayPost(new Date(now)).pipe(
          Effect.provide(
            Layer.merge(
              Layer.succeed(
                SanityProjection,
                makeSanityProjectionStub({ getBirthdayPeople }),
              ),
              makeTestEnvLayer({ SLACK_BIRTHDAY_WEBHOOK_URL: webhook }),
            ),
          ),
        ),
      ),
    );
    return { promise, getBirthdayPeople };
  };

  it("posts the birthday message to Slack", async () => {
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { promise } = run(WEBHOOK, "2026-10-22T07:00:00Z");
    expect((await promise)._tag).toBe("Right");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(fetchMock.mock.calls[0])).toContain("An Smet");
  });

  it("is a no-op without the secret — no read, no POST", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { promise, getBirthdayPeople } = run(
      undefined,
      "2026-10-22T07:00:00Z",
    );
    expect((await promise)._tag).toBe("Right");
    expect(getBirthdayPeople).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts nothing on an empty day", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { promise } = run(WEBHOOK, "2026-10-21T07:00:00Z");
    expect((await promise)._tag).toBe("Right");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails when Slack does not confirm", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("no", { status: 500 })),
    );
    const { promise } = run(WEBHOOK, "2026-10-22T07:00:00Z");
    expect((await promise)._tag).toBe("Left");
  });
});

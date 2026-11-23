import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type { FORM_ROUTING_CONTACTS_QUERY_RESULT } from "../sanity/sanity.types";

vi.mock("../sanity/client", () => ({
  sanityClient: { fetch: vi.fn() },
}));

import { sanityClient } from "../sanity/client";
import {
  FormRoutingRepository,
  FormRoutingRepositoryLive,
} from "./form-routing.repository";

const mockFetch = sanityClient.fetch as unknown as ReturnType<typeof vi.fn>;

const getContacts = () =>
  Effect.runPromise(
    Effect.gen(function* () {
      const repo = yield* FormRoutingRepository;
      return yield* repo.getContacts();
    }).pipe(Effect.provide(FormRoutingRepositoryLive)),
  );

const box = (
  functionTitle: string | null,
  holder: { firstName: string | null; lastName: string | null } | null,
) => ({ functionTitle, holder });

const row = (
  overrides: Partial<NonNullable<FORM_ROUTING_CONTACTS_QUERY_RESULT>> = {},
): FORM_ROUTING_CONTACTS_QUERY_RESULT => ({
  speler: null,
  jeugdspeler: null,
  vrijwilliger: null,
  trainer: null,
  scheidsrechter: null,
  ...overrides,
});

describe("FormRoutingRepository.getContacts", () => {
  it("names the holder and function title per role", async () => {
    mockFetch.mockResolvedValueOnce(
      row({
        vrijwilliger: box("Voorzitter", {
          firstName: " An ",
          lastName: "Peeters",
        }),
      }),
    );

    expect(await getContacts()).toEqual({
      vrijwilliger: { name: "An Peeters", functionTitle: "Voorzitter" },
    });
  });

  it("keeps a holder whose box has no title, without a title", async () => {
    mockFetch.mockResolvedValueOnce(
      row({ trainer: box(" ", { firstName: "Jan", lastName: null }) }),
    );

    expect(await getContacts()).toEqual({
      trainer: { name: "Jan", functionTitle: null },
    });
  });

  it.each([
    ["no config document", null],
    ["no reference on any role", row()],
    [
      "a vacant box",
      row({ speler: box("Voorzitter", null), trainer: box("Coach", null) }),
    ],
    [
      "a holder without a name",
      row({ speler: box("Voorzitter", { firstName: null, lastName: " " }) }),
    ],
  ])("yields no contact for %s", async (_label, data) => {
    mockFetch.mockResolvedValueOnce(data);

    expect(await getContacts()).toEqual({});
  });

  it("fails with the typed Sanity error when the read fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("boom"));

    await expect(getContacts()).rejects.toThrow(/Sanity fetch failed/);
  });
});

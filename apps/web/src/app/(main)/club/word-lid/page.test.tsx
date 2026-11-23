import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Effect, Layer } from "effect";

const getContacts = vi.fn();

// The real runtime needs the BFF env; run the page's own effect directly.
vi.mock("@/lib/effect/runtime", () => ({
  runPromise: (effect: Effect.Effect<unknown>) => Effect.runPromise(effect),
}));

vi.mock("@/lib/repositories/form-routing.repository", async (original) => {
  const mod =
    await original<
      typeof import("@/lib/repositories/form-routing.repository")
    >();
  return {
    ...mod,
    FormRoutingRepositoryLive: Layer.succeed(mod.FormRoutingRepository, {
      getContacts: () => getContacts(),
    }),
  };
});

vi.mock("@/components/club/MembershipForm/MembershipForm", () => ({
  MembershipForm: ({ contacts }: { contacts?: unknown }) => (
    <pre data-testid="form">{JSON.stringify(contacts ?? null)}</pre>
  ),
}));

const { default: WordLidPage, revalidate } = await import("./page");

const LEAD =
  "Speler, jeugdspeler, vrijwilliger, trainer of scheidsrechter — vul het formulier in en we nemen binnenkort contact met je op. Dit is een aanvraag: sommige ploegen zitten vol, dus een plekje is niet altijd gegarandeerd.";

describe("/club/word-lid page (#3640)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("revalidates hourly", () => {
    expect(revalidate).toBe(3600);
  });

  it("passes the read contacts to the form", async () => {
    const contacts = {
      speler: { name: "An Peeters", functionTitle: "Voorzitter" },
    };
    getContacts.mockReturnValue(Effect.succeed(contacts));

    render(await WordLidPage());

    expect(JSON.parse(screen.getByTestId("form").textContent!)).toEqual(
      contacts,
    );
  });

  it("degrades a failed read to no contacts and still renders the form", async () => {
    getContacts.mockReturnValue(Effect.fail(new Error("sanity down")));

    render(await WordLidPage());

    expect(screen.getByTestId("form")).toHaveTextContent("{}");
  });

  it("keeps the page lead as it was", async () => {
    getContacts.mockReturnValue(Effect.succeed({}));

    render(await WordLidPage());

    expect(screen.getByText(LEAD)).toBeInTheDocument();
  });
});

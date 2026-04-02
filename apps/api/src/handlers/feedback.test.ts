import { describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import {
  SanityWriteClient,
  type SanityWriteClientInterface,
  SanityError,
} from "../sanity/client";
import { handleFeedback } from "./feedback";

function makeSanityMock(
  writeFeedbackImpl?: SanityWriteClientInterface["writeFeedback"],
): SanityWriteClientInterface {
  return {
    upsertPlayer: () => Effect.succeed(undefined),
    upsertTeam: () => Effect.succeed(undefined),
    upsertStaff: () => Effect.succeed(undefined),
    uploadPlayerImage: () => Effect.succeed(undefined),
    archivePlayers: () => Effect.succeed(undefined),
    archiveStaff: () => Effect.succeed(undefined),
    archiveTeams: () => Effect.succeed(undefined),
    writeFeedback: writeFeedbackImpl ?? (() => Effect.succeed(undefined)),
  };
}

describe("handleFeedback", () => {
  it("calls writeFeedback and returns ok: true", async () => {
    const writeFeedbackSpy = vi.fn(() => Effect.succeed(undefined as void));
    const mock = makeSanityMock(writeFeedbackSpy);
    const layer = Layer.succeed(SanityWriteClient, mock);

    const result = await Effect.runPromise(
      Effect.provide(
        handleFeedback({
          pathSlug: "inschrijving-nieuw-lid",
          pathTitle: "Inschrijving nieuw lid",
          vote: "up",
        }),
        layer,
      ),
    );

    expect(result).toEqual({ ok: true });
    expect(writeFeedbackSpy).toHaveBeenCalledWith({
      pathSlug: "inschrijving-nieuw-lid",
      pathTitle: "Inschrijving nieuw lid",
      vote: "up",
    });
  });

  it("propagates SanityError as die", async () => {
    const mock = makeSanityMock(() =>
      Effect.fail(new SanityError("Sanity is down")),
    );
    const layer = Layer.succeed(SanityWriteClient, mock);

    await expect(
      Effect.runPromise(
        Effect.provide(
          handleFeedback({
            pathSlug: "test",
            pathTitle: "Test",
            vote: "down",
          }),
          layer,
        ),
      ),
    ).rejects.toThrow();
  });
});

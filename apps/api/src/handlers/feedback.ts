import { Effect } from "effect";
import { SanityWriteClient } from "../sanity/client";

export const handleFeedback = (payload: {
  pathSlug: string;
  pathTitle: string;
  vote: "up" | "down";
}) =>
  Effect.gen(function* () {
    const sanity = yield* SanityWriteClient;
    yield* sanity.writeFeedback(payload).pipe(Effect.orDie);
    return { ok: true as const };
  });

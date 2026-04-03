import { Effect } from "effect";
import { SanityMutation } from "../sanity/mutation";

export const handleFeedback = (payload: {
  pathSlug: string;
  pathTitle: string;
  vote: "up" | "down";
}) =>
  Effect.gen(function* () {
    const sanity = yield* SanityMutation;
    yield* sanity.writeFeedback(payload).pipe(Effect.orDie);
    return { ok: true as const };
  });

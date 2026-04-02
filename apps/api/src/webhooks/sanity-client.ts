import { createClient } from "@sanity/client";
import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";

export class WebhookSanityError extends Error {
  readonly _tag = "WebhookSanityError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export interface WebhookSanityClientInterface {
  readonly fetchDocument: (
    id: string,
    query: string,
  ) => Effect.Effect<Record<string, unknown> | null, WebhookSanityError>;
}

export class WebhookSanityClient extends Context.Tag("WebhookSanityClient")<
  WebhookSanityClient,
  WebhookSanityClientInterface
>() {}

export const WebhookSanityClientLive = Layer.effect(
  WebhookSanityClient,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const client = createClient({
      projectId: env.SANITY_PROJECT_ID,
      dataset: env.SANITY_DATASET,
      apiVersion: "2024-01-01",
      token: env.SANITY_API_TOKEN,
      useCdn: false,
    });

    return {
      fetchDocument: (id, query) =>
        Effect.tryPromise({
          try: () =>
            client.fetch<Record<string, unknown> | null>(query, { id }),
          catch: (cause) =>
            new WebhookSanityError(
              `Sanity fetch failed for ${id}: ${String(cause)}`,
              cause,
            ),
        }),
    };
  }),
);

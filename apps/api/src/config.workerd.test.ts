/**
 * `config.ts` against the REAL Worker `env` — Miniflare's bindings, objects
 * (KV, Durable Object) next to string vars. The node tests feed
 * `ConfigProvider.fromJson` a plain object; only workerd shows it reading the
 * runtime's own `env`.
 */
import { env } from "cloudflare:test";
import { Config, ConfigProvider, Effect, Redacted } from "effect";
import { describe, expect, it } from "vitest";
import { psdApi, workerConfigProvider } from "./config";

describe("config.ts against the real Worker env (workerd)", () => {
  it("reads a var and a secret through Config", async () => {
    const { baseUrl, apiKey } = await Effect.runPromise(
      psdApi.pipe(Effect.withConfigProvider(workerConfigProvider(env))),
    );
    expect(baseUrl).toBe("https://clubapi.example.test");
    expect(Redacted.value(apiKey)).toBe("workerd-test-key");
    expect(String(apiKey)).not.toContain("workerd-test-key");
  });

  it("reads them through ConfigProvider.fromJson(env) itself, bindings and all", async () => {
    const apiKey = await Effect.runPromise(
      Config.redacted("PSD_API_KEY").pipe(
        Effect.withConfigProvider(ConfigProvider.fromJson(env)),
      ),
    );
    expect(Redacted.value(apiKey)).toBe("workerd-test-key");
  });

  it("does not take a binding for a var", async () => {
    const error = await Effect.runPromise(
      Config.string("PSD_CACHE").pipe(
        Effect.flip,
        Effect.withConfigProvider(workerConfigProvider(env)),
      ),
    );
    expect(String(error)).toContain("PSD_CACHE");
  });
});

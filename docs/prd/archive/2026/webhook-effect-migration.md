---
status: completed
completed_at: 2026-04-02
completed_in: "#1189, #1190"
---

# PRD: Webhook Handler — Migrate to Effect

**Status**: Ready for implementation
**Date**: 2026-04-02
**Issues**: #1189 (Effect-wrap + schema), #1190 (replace inline services)

---

## 1. Problem Statement

The Sanity webhook handler (`src/webhooks/index-handler.ts`, 240 lines) is the only request handler in `apps/api` that bypasses the Effect pipeline. It uses imperative `Request`/`Response` with manual type narrowing (`doc as { ... }`), early-return error handling, and direct instantiation of a Sanity client, embedding service, and vectorize calls. This creates a parallel error handling strategy, untestable dependency construction, and duplicated logic (the handler builds embeddings and upserts vectors inline, while `EmbeddingService` and `VectorizeService` already encapsulate this). Any change to the search indexing pipeline requires updating two code paths.

## 2. Scope

**Packages touched**: `apps/api`

**In scope**:

- Rewrite `index-handler.ts` to use Effect for error handling and dependency injection
- Use existing `EmbeddingService` and `VectorizeService` instead of inline calls
- Add Effect Schema validation for webhook payloads (replace manual type narrowing)
- Keep Svix signature verification (can stay as a pure function)
- Maintain existing test coverage, adapted to Effect-based testing patterns

**Out of scope**:

- Changing webhook behavior or supported document types
- Adding new document types to the search index
- Moving webhook routes into HttpApiBuilder (can stay as a separate handler if simpler)
- `SanityMutation`/`SanityProjection` split (separate PRD, but webhook should use `SanityProjection` for doc fetching once available)

## 3. Tracer Bullet

Wrap the existing handler's happy path in `Effect.gen`:

- Keep the same `Request → Response` signature (Workers entry point requires it)
- Replace the first `parsePayload` + `verifySvixSignature` block with Effect pipeline: `Effect.tryPromise` for body read → `S.decodeUnknown(WebhookPayload)` for validation → signature check
- Remaining logic stays imperative for now
- Existing tests pass with minimal adaptation
- `pnpm --filter @kcvv/api check-all` passes

## 4. Phases

```text
Phase 1: Tracer bullet — Effect-wrap payload parsing + signature verification
Phase 2: Replace inline Sanity fetch with SanityProjection dependency
Phase 3: Replace inline embedding + vectorize with EmbeddingService + VectorizeService
Phase 4: Add WebhookPayload Effect Schema, remove manual type narrowing
```

## 5. Acceptance Criteria per Phase

### Phase 1: Tracer bullet

- [ ] Handler uses `Effect.gen` for payload parsing and signature verification
- [ ] Errors produce the same HTTP status codes as before (400 for bad payload, 401 for bad signature)
- [ ] Existing webhook tests pass
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 2: Replace inline Sanity fetch

- [ ] Handler uses `SanityProjection` (or a webhook-specific projection) for document fetching instead of creating its own Sanity client
- [ ] No direct `createClient` call in webhook handler
- [ ] Test mocks use Effect Layer instead of manual client stubs

### Phase 3: Replace inline embedding + vectorize

- [ ] Handler yields `EmbeddingService` and `VectorizeService` from Effect context
- [ ] No inline `env.AI.run()` or `env.VECTORIZE_INDEX.upsert()` calls in handler
- [ ] Index text builder functions (`buildArticleIndexText`, etc.) stay as pure functions
- [ ] `pnpm --filter @kcvv/api check-all` passes

### Phase 4: Schema validation

- [ ] `WebhookPayload` defined as Effect Schema class (replaces `interface WebhookPayload`)
- [ ] Document type dispatch uses schema-validated `_type` field
- [ ] All manual `doc as { ... }` casts removed
- [ ] `pnpm --filter @kcvv/api check-all` passes

## 6. Effect Schema / api-contract Changes

None. Webhook schemas are internal to `apps/api` (not part of the BFF contract).

New internal schema:

```typescript
// src/webhooks/schemas.ts
class WebhookPayload extends S.Class<WebhookPayload>("WebhookPayload")({
  _id: S.String,
  _type: S.String,
  _rev: S.optional(S.String),
}) {}
```

## 7. Open Questions

- [ ] Should the webhook handler move inside `HttpApiBuilder` as a proper route, or stay as a separate handler wired in `index.ts`? — Evaluate during Phase 1 (if Effect wrapping is clean enough, a separate handler is fine)
- [ ] Should document fetching use `SanityProjection` from the sanity-client-split PRD, or a webhook-specific fetch? — Depends on timing; if sanity-client-split ships first, use it

## 8. Discovered Unknowns

- [2026-04-02] Webhook handler stays as separate handler in `index.ts` — Effect wrapping is clean enough, no need to move into HttpApiBuilder. The handler uses `Effect.gen` internally but keeps `Request → Response` entry point for Workers compatibility.
- [2026-04-02] Document-level `as` casts remain in `buildDocumentIndex` helper for Sanity doc shapes (dynamic/untyped from GROQ). These should be addressed in Phase 2/3 when SanityProjection provides typed fetches.
- [2026-04-02] `VectorizeService` was missing `deleteByIds` — added to interface and implementation during Phase 2/3 (needed for webhook delete path). Resolved inline.
- [2026-04-02] `SanityProjection` does not exist yet — created `WebhookSanityClient` as a webhook-specific projection service. When sanity-client-split ships, this can be replaced with `SanityProjection`.

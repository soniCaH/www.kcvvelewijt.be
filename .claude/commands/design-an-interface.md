# Design an Interface

Generate multiple radically different interface designs for a module, then compare them before committing to implementation. Based on the "Design It Twice" principle from A Philosophy of Software Design.

## When to use this

Invoke before implementing any of these:

- A new Effect service (SanityService, BffService, etc.)
- A new HttpApiGroup endpoint shape in api-contract
- A new Sanity query abstraction
- Any module where the boundary between caller and implementation is non-obvious
- When /grill-me surfaces uncertainty about the interface shape

Do NOT use for: simple components, straightforward CRUD routes, or anything where the interface is obvious from the requirements.

## Step 1 — Gather requirements

Before designing anything, answer these by exploring the codebase:

1. **Who calls this?** Find the actual call sites (or where they will be). Read them.
2. **What are the 3 most important operations?** Not all operations — the critical ones.
3. **What must be hidden?** What complexity should callers never see?
4. **What are the constraints?** Effect pipeline? Cloudflare Worker runtime? Sanity GROQ? Cache TTL?
5. **What will change?** What parts of the implementation are likely to evolve?

## Step 2 — Generate two radically different designs using parallel subagents

Spawn two subagents simultaneously. Each gets the requirements and produces a complete interface design independently. They must not converge — force them to be different.

**Subagent A prompt:**
"Design the simplest possible interface for [module]. Minimise the number of methods. Callers should need to know as little as possible about internals. Err toward fewer, more general methods."

**Subagent B prompt:**
"Design the most explicit possible interface for [module]. Each operation gets its own method. Make the types self-documenting. Err toward more methods with precise names."

Each subagent produces:

```typescript
// Interface name and shape
interface [Name]Service {
  method(params: Params): Effect.Effect<Result, Error>
  // ...
}

// Example call site — how would a component/handler actually use this?
const result = yield* [Name]Service.method({ ... })
```

## Step 3 — Evaluate each design against these criteria

| Criterion            | Question                                                                       |
| -------------------- | ------------------------------------------------------------------------------ |
| **Simplicity**       | How many things must a caller know to use this?                                |
| **Depth**            | Does a small interface hide significant complexity?                            |
| **Generality**       | Can it handle future use cases without changes?                                |
| **Effect fit**       | Does it compose naturally in Effect pipelines?                                 |
| **Testability**      | Can it be mocked cleanly at the boundary?                                      |
| **KCVV conventions** | Does it follow existing service patterns in apps/web/src/lib/effect/services/? |

## Step 4 — Recommend one and explain why

State clearly:

- Which design wins and on which criteria
- What the losing design does better (there's always a tradeoff)
- Any elements from the losing design worth borrowing

## Step 5 — Write the interface to docs/design/

Save the winning interface (with reasoning) to:
`docs/design/[module-name]-interface.md`

This becomes the contract for the implementation PRD. Do NOT implement yet.

Tell the user:

```
Interface design complete. Review docs/design/[module-name]-interface.md.
When you're happy with it, run /write-a-prd to plan the implementation.
```

## KCVV-specific interface patterns

### Effect services

```typescript
// Always use Effect.Effect<Result, SpecificError, never>
// Never use Promise, never throw
// Tag the service for dependency injection
export class [Name]Service extends Effect.Service<[Name]Service>()(
  "[Name]Service",
  { effect: Layer... }
) {}
```

### HttpApiGroup (api-contract)

```typescript
// Endpoints go in packages/api-contract/src/
// Group by domain: MatchesApi, RankingApi, StatsApi
// Never add endpoints speculatively — only what apps/api actually needs
```

### Sanity queries

```typescript
// Always typed: client.fetch<SanityType>(query, params)
// GROQ queries live in apps/web/src/lib/repositories/
// One file per domain: article.repository.ts, player.repository.ts, etc.
```

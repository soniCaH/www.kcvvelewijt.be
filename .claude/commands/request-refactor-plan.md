# Request Refactor Plan

Analyze the current codebase and produce a prioritized refactor plan. Run this after a surge of development, or weekly. Each high-priority item becomes a GitHub issue that feeds the Ralph loop.

## What to look for

1. **Module boundaries** — components or services doing too much; opportunities for deep modules with thin interfaces that make AI navigation easier
2. **Test boundary confusion** — tests reaching across layers; service tests that mock components or component tests that reach into services
3. **Effect patterns** — any `S.Unknown`, unsafe casts, missing error handling, `Effect.runSync` in async contexts
4. **api-contract drift** — types in `apps/web` that belong in `packages/api-contract`; unused endpoints that were YAGNI'd in
5. **Sanity query sprawl** — duplicate or near-duplicate GROQ queries that could be consolidated
6. **Dead code** — imports, exports, or utility functions no longer used
7. **Tailwind consistency** — one-off values that should be tokens; repeated class combos that should be components
8. **Discovered unknowns backlog** — scan all `docs/prd/*.md` files for unresolved items in the "Discovered unknowns" section that never got a GitHub issue

## Output format

Ranked list. For each item:

```
## [High/Medium/Low] Title

**Why:** One sentence on the problem.
**Scope:** Which files/packages.
**Approach:** Concrete first step.
**Risk:** What could break and how to verify it didn't.
```

## After the plan

For each High priority item, create a GitHub issue:

```bash
gh issue create \
  --title "refactor(scope): [title]" \
  --label "refactor,ready" \
  --body "[why + approach + risk]"

gh project item-add 2 --owner soniCaH --url "[issue-url]"
```

These feed directly into the Ralph loop — labeled `ready`, Ralph picks them up automatically.

## Rule

Do not implement during this session. Plan only. Implementation happens in dedicated worktrees via `./scripts/ralph.sh`.

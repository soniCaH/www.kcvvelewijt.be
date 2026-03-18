# Triage an Issue

Investigate a bug or unexpected behaviour by exploring the codebase, identify the root cause, and file a GitHub issue with a complete TDD-based fix plan. The output feeds directly into the Ralph loop.

## When to use this

Invoke when:

- Something is broken and you don't know why yet
- A user reports unexpected behaviour
- A CI check is failing with an unclear error
- You want Claude to investigate before you spend time on it yourself

Usage:

```
/triage-issue The match widget shows wrong date for postponed games
/triage-issue #847
/triage-issue CI failing on BffService.test.ts since last deploy
```

## Step 1 — Reproduce the problem

Before reading any code, establish what "broken" actually means:

1. What is the observed behaviour?
2. What is the expected behaviour?
3. Is this always broken or only in specific conditions? (specific team, specific match state, specific date format?)
4. When did it start? (`git log --oneline --since="1 week ago"` if unknown)

If a GitHub issue number was provided, read it first:

```bash
gh issue view [N]
```

## Step 2 — Locate the code

Follow the data flow from symptom to source. For KCVV:

**Frontend symptoms** → start in `apps/web/src/`

- Component rendering wrong? → `src/components/`
- Data fetching wrong? → `src/lib/effect/services/` or `src/lib/sanity/queries/`
- Route/page wrong? → `src/app/(main)/`

**API/BFF symptoms** → start in `apps/api/src/`

- Wrong response shape? → `src/handlers/`
- Cache returning stale data? → `src/cache/kv-cache.ts`
- PSD API transform wrong? → `src/footbalisto/transforms.ts`

**Schema/type errors** → start in `packages/api-contract/src/`

Use grep to follow the trail:

```bash
grep -r "functionName\|ComponentName" apps/ packages/ --include="*.ts" --include="*.tsx" -l
```

## Step 3 — Identify the root cause

Read the relevant code. For each candidate cause, ask:

- Is this the cause or a symptom?
- What test would prove this is the problem?
- What test would prove this is fixed?

Write a one-sentence root cause statement:

> "The bug is in [file]:[line] — [what it does wrong] because [why]."

## Step 4 — Check for existing tests

```bash
# Find related tests
find apps packages -name "*.test.ts" -o -name "*.test.tsx" | xargs grep -l "[relevant term]" 2>/dev/null
```

If a test exists that should have caught this: note it. The fix plan must include understanding why it didn't catch it (wrong mock? wrong assertion? wrong boundary?).

## Step 5 — File a GitHub issue

Create a well-structured issue that Ralph can pick up:

```bash
gh issue create \
  --title "fix(scope): [one-line description]" \
  --label "ready" \
  --milestone "[relevant milestone if applicable]" \
  --body "## Root cause

[Your one-sentence root cause statement]

**File:** \`[path/to/file.ts]\`
**Line:** [N]

## Reproduction

[Steps or conditions that trigger the bug]

## Fix plan (TDD)

Phase 1 — failing test:
\`\`\`typescript
// Test that proves the bug exists — this should fail before the fix
it('should [expected behaviour]', () => {
  // ...
})
\`\`\`

Phase 2 — fix:
[One sentence description of the code change needed]

Phase 3 — verify no regression:
[Which existing tests must still pass]

## Acceptance criteria
- [ ] [Specific testable condition]
- [ ] Existing tests still pass
- [ ] \`pnpm --filter @kcvv/[package] check-all\` passes

## Scope
**Package:** [apps/web | apps/api | packages/api-contract]"
```

Then add to the project board:

```bash
gh project item-add 2 --owner soniCaH --url "[issue-url]"
```

## Step 6 — Report back

Tell the user:

- Root cause in one sentence
- The issue number that was created
- Whether this is a quick fix (< 1h) or needs a full Ralph session

If the root cause is unclear after investigation, say so explicitly and list what you tried. Don't guess.

## KCVV-specific gotchas to check

- **Date timezone issues** — `date` field from PSD always has `00:00` time component, actual time is in separate `time` field
- **Cache deserialization** — always use `S.decodeUnknown(schema)` on KV cache reads, never `JSON.parse(...) as T`
- **Barrel re-export duplicates** — if a type disappears or is `any`, check for duplicate exports in api-contract barrel
- **Turbopack vs tsc** — type-check passing doesn't mean build passing; if symptoms appear only on Vercel, run `pnpm turbo build`
- **Worktree confusion** — if code looks right locally but wrong in CI, check which worktree you're in: `git branch --show-current`

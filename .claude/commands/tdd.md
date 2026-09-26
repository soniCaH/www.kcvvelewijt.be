# TDD — Red Green Refactor

Implement the feature in this issue using strict Test-Driven Development.

## Craft lives upstream — read it first

This file is KCVV **policy**: which layer the code belongs in, what may be mocked here, how the loop runs against our commands, and what to do when implementation reveals work the issue never accounted for.

It deliberately says nothing about what separates a test worth keeping from a test worth deleting. That is craft, it is not ours, and it improves without us. Read `/mattpocock-skills:tdd` for it — what a good test is, seams, anti-patterns, the rules of the loop — then come back here.

Where the two disagree, this file wins: it knows the codebase, and upstream does not. Three places they already do:

- **Seams.** Upstream says to confirm the seams with the user before writing a test. Under `/ralph-afk` there is no user to confirm with, and stopping to ask is the one thing the brief forbids. The issue's acceptance criteria and its PRD **are** the pre-agreed seams. Write down which ones you are testing at, put that list in the PR body, and keep going.
- **Refactor.** Upstream puts refactoring in the review stage, outside the loop. Here it stays inside the loop, as REFACTOR below — our review stage runs against a pushed branch and is too late to reshape the code.
- **Mocking.** Upstream's `mocking.md` is general guidance. The list under "What should be mocked?" below is the KCVV boundary and overrides it.

## Before the first test — interface design

Read the issue body. Find the PRD at the path listed. Answer these before writing anything:

1. **Is this a tracer bullet issue?** If yes: implement the thinnest possible slice that crosses ALL layers. No caching, no error states, no edge cases — just prove the path works end-to-end. One test. One implementation. Done.

2. **What is the module boundary?** Where does this code live — service, component, api-contract, BFF handler? Resist putting logic in the wrong layer.

3. **Deep module design:** Can we expose a small interface that hides complex logic internally? Test the interface, not the internals.

4. **What should be mocked?**
   - DO mock: Sanity client, PSD API HTTP calls, Cloudflare KV, `fetch`
   - DO NOT mock: Effect schemas, pure transformation functions, your own business logic
   - Mock at module boundaries only — never mock what you own

## The loop (repeat until all acceptance criteria pass)

### RED

Write exactly ONE failing test for the next behavior.
Run it. Confirm it fails for the RIGHT reason — an assertion failure, not a compile error.

```bash
cd [worktree-path]
pnpm --filter @kcvv/web exec vitest run [test-file] 2>&1 | tail -20
# or for BFF:
pnpm --filter @kcvv/api exec vitest run [test-file] 2>&1 | tail -20
```

### GREEN

Write the minimal code to pass that one test. Nothing speculative. Nothing for the next test.

### REFACTOR

After all current tests are green: eliminate duplication, improve naming, simplify.
No new behavior during refactor. Run full suite to confirm still green.

```bash
pnpm turbo run lint type-check test build --filter=@kcvv/web --output-logs=errors-only 2>&1 | tail -10
```

Repeat.

## When you discover something unexpected

This happens. It's expected. When implementation reveals something the PRD or issue didn't account for:

**Option A — Resolvable inline (small, same scope):**
Fix it, add a test, continue. Append to the PRD's "Discovered unknowns" section:

```bash
echo "- [$(date +%Y-%m-%d)] Discovered: [what] → resolved inline" >> docs/prd/[feature-name].md
```

**Option B — New work needed (different scope, or blocks this issue):**
Do NOT expand this worktree's scope. Instead:

```bash
# Create a new issue for the discovered work
gh issue create \
  --title "[type](scope): [discovered work]" \
  --label "ready" \
  --body "Discovered during implementation of #[current-issue].\n\n[description]"

# Comment on current issue
gh issue comment [current-issue] --body "Discovered during implementation: created #[new-issue] to track [what]."

# Append to PRD
echo "- [$(date +%Y-%m-%d)] Discovered: [what] → new issue #[N]" >> docs/prd/[feature-name].md
```

**Option C — Blocks this issue (can't proceed without resolving it):**

```bash
gh issue edit [current-issue] --add-label "blocked"
gh issue comment [current-issue] --body "Blocked: [what is blocking]. Created #[new-issue] to resolve."
# Stop. Return to ralph loop. Ralph will pick up the blocking issue.
```

## Done when

- All acceptance criteria in the issue body are covered by passing tests
- `pnpm turbo run lint type-check test build --filter=@kcvv/web` passes (filter on the workspace you changed)
- No test mocks what it shouldn't
- Discovered unknowns have been handled (new issues created or resolved inline)
- Conventional commit referencing the issue: `feat(scope): description\n\nCloses #N`

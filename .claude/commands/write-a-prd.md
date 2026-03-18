# Write a PRD

Write a Product Requirements Document for the feature we've just discussed.

## Important: PRDs are living documents

Do NOT run git commit or git push. After creating issues, tell the user
what to commit and they will do it manually.

A PRD is not a contract. It's a shared understanding at a point in time. Open questions belong IN the PRD, not resolved before writing. Unknowns discovered during implementation get fed back as GitHub issue updates. The PRD evolves.

## Structure

### 1. Problem statement

One paragraph. What user or club problem does this solve? What breaks today without it?

### 2. Scope

Which packages are touched: `apps/web` | `apps/api` | `packages/api-contract` | `apps/studio`
What is explicitly OUT of scope (name it — prevents scope creep during Ralph loop).

### 3. Tracer bullet

Before full implementation, what is the thinnest possible slice that crosses ALL layers end-to-end?
This is the first issue created. It proves the architecture works before building the rest.

Example: "A single hardcoded match rendered at `/game/test` via the real BFF endpoint — no caching, no error states, no design."

### 4. Phases

Break implementation into phases where each phase = one deployable unit, runnable tests, no broken state.
Each phase becomes one or more GitHub issues.

```
Phase 1: [name] — tracer bullet (always first)
Phase 2: [name]
Phase 3: [name]
```

### 5. Acceptance criteria per phase

For each phase, concrete testable conditions. Each maps to either a Vitest test or a manual check.

- [ ] ...
- [ ] `pnpm --filter @kcvv/web check-all` passes

### 6. Effect Schema / api-contract changes

New schemas, updated types, new HttpApi endpoints. None added speculatively — only what Phase 1 actually needs.

### 7. Open questions

These are NOT blockers to writing the PRD. List what is genuinely unknown:

- `[ ]` Question — who resolves it / how
- `[ ]` Question — will be answered by tracer bullet
- `[ ]` Question — needs your decision

Open questions that survive into implementation become `blocked` labels on GitHub issues.

### 8. Discovered unknowns section (filled during implementation)

Leave this blank now. During Ralph loop, Claude appends here when it hits something unexpected:

```
- [date] Discovered: [what was found] → [action taken: new issue #N / PRD updated / resolved inline]
```

## Output

Save the PRD as `docs/prd/[feature-name].md` in the repo.
After writing, ask: "Should I run /prd-to-issues now, or do you want to review first?"

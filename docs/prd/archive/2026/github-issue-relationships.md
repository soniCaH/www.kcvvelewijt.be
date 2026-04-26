# PRD: GitHub Native Issue Relationships

**Status**: Ready for implementation
**Issues**: #1049, #1050, #1051, #1052
**Milestone**: github-issue-relationships
**Date**: 2026-03-25

---

## 1. Problem Statement

Ralph's unblocking logic parses markdown body text (`Blocked by #NNN`) using string matching to determine issue dependencies. This approach is fragile: completing issue #882 prematurely unblocked #891 because the body happened to mention `#882` in a context paragraph, not in the "Blocked by" list. A hotfix now checks all blockers before unblocking, but the root cause remains — dependency information lives in unstructured markdown, parsed with regex/sed, and varies between the automated `ralph.sh` script and the interactive `/ralph` command.

GitHub's native blocking relationships (GraphQL `addBlockedBy` / `removeBlockedBy` mutations, `blockedBy` / `blocking` query fields) provide machine-readable issue dependencies. Adopting this replaces fragile body parsing with a stable API, and the GitHub UI shows "blocked by" / "blocking" natively.

## 2. Scope

**Touched:**

- `scripts/ralph.sh` — replace sed-based blocker extraction with GraphQL blockedBy queries
- `.claude/commands/ralph.md` — update guidance for setting/checking blocked status
- `.claude/commands/prd-to-issues.md` — set relationships via GraphQL when creating issues from a PRD
- `docs/prd/` — update PRD template to remove `## Blocked by` markdown convention

**Out of scope:**

- GitHub Projects (user has deleted these — not in use)
- Sub-issues as a parent/child hierarchy (separate concept — not used for blocking)
- Migrating existing closed issues — only apply to new issues going forward
- Changes to `apps/web`, `apps/api`, `apps/studio`, or `packages/api-contract`

## 3. Tracer Bullet

Manually set a blocking relationship between two test issues via GraphQL, then modify `ralph.sh`'s unblock logic to read relationships from the API instead of parsing the body. Verify with a dry run against a real blocked issue.

```graphql
# Create relationship
mutation {
  addBlockedBy(
    input: {
      issueId: "<blocked-issue-node-id>"
      blockingIssueId: "<blocker-issue-node-id>"
    }
  ) {
    issue {
      number
    }
  }
}

# Query blockers for an issue
query {
  repository(owner: "soniCaH", name: "www.kcvvelewijt.be") {
    issue(number: 123) {
      blockedBy(first: 50) {
        nodes {
          number
          state
        }
      }
    }
  }
}
```

Prove the round-trip works before touching the PRD-to-issues pipeline.

## 4. Phases

### Phase 1: Tracer bullet — GraphQL blockedBy in ralph.sh (#1049)

Replace the sed-based blocker extraction in `ralph.sh` with GraphQL `blockedBy` queries.

### Phase 2: prd-to-issues sets relationships via GraphQL (#1050)

When `/prd-to-issues` creates issues with dependencies, set blocking relationships via `addBlockedBy` mutation instead of (or in addition to) writing `## Blocked by` markdown.

### Phase 3: Update /ralph command guidance (#1051)

Update the interactive `/ralph` command to use GraphQL blockedBy relationship checks. Update the "if blocked" instructions to set relationships via `addBlockedBy` mutation.

### Phase 4: Remove markdown convention (#1052)

Remove `## Blocked by` from the PRD issue template. Update existing PRD template documentation.

## 5. Acceptance Criteria per Phase

### Phase 1

- [ ] `ralph.sh` unblock logic queries GraphQL `blockedBy` instead of parsing body text
- [ ] Completing one blocker of a multi-blocked issue does NOT unblock the issue (remaining `blockedBy` relationships still apply)
- [ ] Completing the last blocker correctly unblocks the issue (no open `blockedBy` nodes remain)
- [ ] Fallback: if GraphQL `blockedBy` query returns an error, `ralph.sh` logs a warning and skips (don't crash the loop)
- [ ] Tested manually against a real pair of test issues

### Phase 2

- [ ] `/prd-to-issues` creates blocking relationships via `addBlockedBy` mutation for issues with dependencies
- [ ] Relationships are visible in the GitHub UI on created issues
- [ ] Existing `## Blocked by` markdown is still written for human readability (transitional)

### Phase 3

- [ ] `/ralph` command instructions reference GraphQL blockedBy checks
- [ ] "If blocked" flow sets a relationship via `addBlockedBy` mutation in addition to labeling

### Phase 4

- [ ] PRD issue template no longer includes `## Blocked by` section
- [ ] `ralph.sh` no longer contains any body-parsing fallback code

## 6. Effect Schema / api-contract Changes

None. This is entirely tooling and workflow.

## 7. Open Questions

- [x] Does the Sub-issues API support "blocked by" as a relationship type, or only parent/child? — **Corrected 2026-03-25:** GitHub has native `blockedBy` / `blocking` relationships via GraphQL (separate from sub-issues). We now use `addBlockedBy` / `removeBlockedBy` mutations and the `blockedBy(first: N)` query field. Sub-issues are for parent/child hierarchy only.
- [x] Is the blockedBy GraphQL API available on our GitHub plan? — **Yes**, confirmed 2026-03-25. Both read (`blockedBy`, `blocking` query fields) and write (`addBlockedBy`, `removeBlockedBy` mutations) work. Uses `node_id` (not integer `id`).
- [x] Should Phase 2 write both API relationships AND markdown (transitional), or API-only from the start? — **Both (transitional).** API relationships for machine-readable dependencies, `## Blocked by` markdown retained for human readability. Markdown will be removed in Phase 4. Decided 2026-03-25.
- [x] Do GitHub Actions or third-party bots interact with these relationships in ways we should be aware of? — No interactions observed. Blocking relationships are a native GitHub feature; no third-party bot interference detected. Confirmed 2026-03-25.

## 8. Discovered Unknowns

- [2026-03-25] GitHub has native "blocked by" / "blocking" issue relationships (separate from sub-issues). The GraphQL API supports `addBlockedBy(input: {issueId, blockingIssueId})` mutation and `blockedBy(first: N)` / `blocking(first: N)` query fields. Both use `node_id`. No REST API equivalent exists.
- [2026-03-25] Unlike sub-issues (where a child can only have one parent), blocking relationships have no fan-out limit — one issue can block many, and one issue can be blocked by many.
- [2026-03-25] GraphQL returns issue state as `"OPEN"` / `"CLOSED"` (uppercase), not `"open"` / `"closed"` as in the REST API.
- [2026-03-25] jq `!=` operator causes issues in zsh due to history expansion of `!`. Use `select(.x == $v | not)` pattern instead.

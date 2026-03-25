# PRD: GitHub Native Issue Relationships

**Status**: Ready for implementation
**Issues**: #1049, #1050, #1051, #1052
**Milestone**: github-issue-relationships
**Date**: 2026-03-25

---

## 1. Problem Statement

Ralph's unblocking logic parses markdown body text (`Blocked by #NNN`) using string matching to determine issue dependencies. This approach is fragile: completing issue #882 prematurely unblocked #891 because the body happened to mention `#882` in a context paragraph, not in the "Blocked by" list. A hotfix now checks all blockers before unblocking, but the root cause remains — dependency information lives in unstructured markdown, parsed with regex/sed, and varies between the automated `ralph.sh` script and the interactive `/ralph` command.

GitHub's native Sub-issues API (`/repos/{owner}/{repo}/issues/{number}/sub_issues`) provides machine-readable issue relationships. Adopting this replaces fragile body parsing with a stable API, and the GitHub UI shows dependency graphs natively.

## 2. Scope

**Touched:**

- `scripts/ralph.sh` — replace sed-based blocker extraction with API calls
- `.claude/commands/ralph.md` — update guidance for setting/checking blocked status
- `.claude/skills/prd-to-issues/` — set relationships via API when creating issues from a PRD
- `docs/prd/` — update PRD template to remove `## Blocked by` markdown convention

**Out of scope:**

- GitHub Projects (user has deleted these — not in use)
- Sub-issues as a parent/child hierarchy (we only need blocking/blocked-by relationships)
- Migrating existing closed issues — only apply to new issues going forward
- Changes to `apps/web`, `apps/api`, `apps/studio`, or `packages/api-contract`

## 3. Tracer Bullet

Manually set a blocking relationship between two test issues via `gh api`, then modify `ralph.sh`'s unblock logic to read relationships from the API instead of parsing the body. Verify with a dry run against a real blocked issue.

```bash
# Create relationship
gh api /repos/{owner}/{repo}/issues/{child}/sub_issues \
  --method POST -f sub_issue_id={parent_issue_node_id}

# Query blockers for an issue
gh api /repos/{owner}/{repo}/issues/{number}/sub_issues
```

Prove the round-trip works before touching the PRD-to-issues pipeline.

## 4. Phases

### Phase 1: Tracer bullet — API-based unblocking in ralph.sh (#1049)

Replace the sed-based blocker extraction in `ralph.sh` with GitHub Sub-issues API calls.

### Phase 2: prd-to-issues sets relationships via API (#1050)

When `/prd-to-issues` creates issues with dependencies, set blocking relationships via `gh api` instead of (or in addition to) writing `## Blocked by` markdown.

### Phase 3: Update /ralph command guidance (#1051)

Update the interactive `/ralph` command to use API-based relationship checks. Update the "if blocked" instructions to set relationships via API.

### Phase 4: Remove markdown convention (#1052)

Remove `## Blocked by` from the PRD issue template. Update existing PRD template documentation.

## 5. Acceptance Criteria per Phase

### Phase 1

- [ ] `ralph.sh` unblock logic queries Sub-issues API instead of parsing body text
- [ ] Completing one blocker of a multi-blocked issue does NOT remove the `blocked` label
- [ ] Completing the last blocker correctly unblocks the issue
- [ ] Fallback: if API returns an error, log a warning and skip (don't crash the loop)
- [ ] Tested manually against a real pair of test issues

### Phase 2

- [ ] `/prd-to-issues` creates blocking relationships via `gh api` for issues with dependencies
- [ ] Relationships are visible in the GitHub UI on created issues
- [ ] Existing `## Blocked by` markdown is still written for human readability (transitional)

### Phase 3

- [ ] `/ralph` command instructions reference API-based blocking checks
- [ ] "If blocked" flow sets a relationship via `gh api` in addition to labeling

### Phase 4

- [ ] PRD issue template no longer includes `## Blocked by` section
- [ ] `ralph.sh` no longer contains any body-parsing fallback code

## 6. Effect Schema / api-contract Changes

None. This is entirely tooling and workflow.

## 7. Open Questions

- [x] Does the Sub-issues API support "blocked by" as a relationship type, or only parent/child? — **Parent/child only.** No native "blocked by" semantics. We model blocking as: blocked issue = parent, blockers = sub-issues (children). When all sub-issues are closed, the parent is unblocked. Confirmed 2026-03-25.
- [x] Is the Sub-issues API available on our GitHub plan? — **Yes**, confirmed 2026-03-25. Both read (`/issues/{n}/sub_issues`) and `sub_issues_summary` field work. Write requires integer `id` (not `node_id` or issue number) for the `sub_issue_id` param.
- [ ] Should Phase 2 write both API relationships AND markdown (transitional), or API-only from the start? — decision needed before Phase 2
- [x] Do GitHub Actions or third-party bots interact with these relationships in ways we should be aware of? — No interactions observed. Sub-issues are a native GitHub feature; no third-party bot interference detected during tracer bullet testing. Confirmed 2026-03-25.

## 8. Discovered Unknowns

- [2026-03-25] `sub_issue_id` for the write endpoint requires the integer database `id` field (from `GET /issues/{n}`), not `node_id` (string). The PRD originally said `node_id` — corrected.
- [2026-03-25] jq `!=` operator causes issues in zsh due to history expansion of `!`. Use `select(.x == $v | not)` pattern instead.
- [2026-03-25] `DELETE /repos/{owner}/{repo}/issues/{n}/sub_issue` (singular) with `-F sub_issue_id=<id>` removes a sub-issue. The plural `/sub_issues/{id}` endpoint does not exist for deletion.

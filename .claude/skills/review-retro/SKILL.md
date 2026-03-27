---
name: review-retro
description: Run after a CodeRabbitAI or code review session to learn from all feedback rounds. Dispatches reflexion:reflect and reflexion:critique in parallel, synthesizes findings, then runs reflexion:memorize to persist learnings and prevent repeat issues in future Ralph sessions.
---

# Review Retrospective

Learn from an entire review session (CodeRabbitAI, PR review, etc.) so the same issues never block a PR again.

## When to Use

- After completing all CodeRabbitAI review rounds on a PR
- After addressing reviewer feedback on a PR
- On your issue branch/worktree, before merging

## Workflow

### Phase 1: Gather Session Context

Collect ALL review feedback from the current session. This means the entire conversation, not just the last message.

1. **Identify the review scope**:
   - What PR / branch / issue is this for?
   - What files were changed?
   - What feedback was received across ALL rounds?

2. **Build a consolidated feedback summary**:
   - Group feedback by category (code quality, architecture, naming, testing, security, performance, style)
   - Note which items were recurring across rounds
   - Note which items required multiple iterations to resolve
   - Distinguish between: (a) legitimate issues to learn from, (b) false positives / style preferences to ignore

3. **Present the summary to the user for confirmation**:

   ```
   Review Retrospective Scope:
   - Branch: [branch name]
   - Issue: [issue reference]
   - Files touched: [count]
   - Feedback rounds: [count]
   - Feedback items collected: [count]
   - Categories: [list]

   Proceeding with parallel analysis...
   ```

### Phase 2: Parallel Analysis

Dispatch TWO agents in parallel using the Agent tool. Each agent receives the full consolidated feedback summary from Phase 1.

**IMPORTANT**: Both agents run simultaneously. Do NOT wait for one before starting the other.

#### Agent 1: Reflector

Use the Agent tool with this prompt structure:

```
You are performing a reflexion:reflect analysis on a code review session.

## Session Context
[Paste the consolidated feedback summary from Phase 1]

## Your Task
Apply the Self-Refinement and Iterative Improvement Framework to this review session.
Focus on:

1. **Pattern Recognition**: What types of mistakes recurred? Group them.
2. **Root Cause Analysis**: WHY did these issues happen? (e.g., unfamiliarity with a pattern, rushing, missing a convention, not checking existing code first)
3. **Preventability Assessment**: For each pattern, what concrete check or habit would have caught it BEFORE the reviewer did?
4. **Quality Gate Proposals**: Suggest specific, actionable rules that could be added to CLAUDE.md to prevent these classes of issues.

Use the Standard Path evaluation. Score the session's code quality.

Output a structured report with:
- Recurring patterns (with frequency)
- Root causes
- Proposed prevention rules (imperative, one-liner format suitable for CLAUDE.md)
- Confidence assessment
```

#### Agent 2: Critic

Use the Agent tool with this prompt structure:

```
You are performing a reflexion:critique analysis on a code review session.

## Session Context
[Paste the consolidated feedback summary from Phase 1]

## Your Task
Apply the Multi-Agent Debate + LLM-as-a-Judge pattern to evaluate this review session.
Adopt three perspectives:

1. **Requirements Validator**: Did the implementation actually meet the issue requirements, or did review feedback reveal gaps?
2. **Solution Architect**: Were architectural choices questioned? What does that reveal about decision-making patterns?
3. **Code Quality Reviewer**: What code quality patterns were flagged? Are these systemic or one-off?

For each perspective, apply Chain-of-Verification: generate 3 verification questions, answer them, and refine your analysis.

Output a structured critique report with:
- Consensus findings across all three perspectives
- Severity-ranked issues (Critical > High > Medium > Low)
- Actionable improvements ranked by impact
- Learning opportunities for future sessions
```

### Phase 3: Synthesize Findings

After both agents return:

1. **Merge findings**: Combine the Reflector's pattern analysis with the Critic's multi-perspective evaluation
2. **Deduplicate**: Remove overlapping findings, keeping the more specific/actionable version
3. **Rank by impact**: Order findings by how much future pain they prevent
4. **Filter for durability**: Only keep insights that will remain valid across multiple future PRs (not one-off fixes)
5. **Separate into categories**:
   - **CLAUDE.md rules**: Imperative, one-liner rules for the project instructions
   - **Memory items**: Context or patterns worth remembering but not strict rules
   - **Discarded**: Items too specific, too vague, or already covered

6. **Present synthesis to user**:

   ```markdown
   ## Retrospective Synthesis

   ### Patterns Found

   [Ranked list of recurring issues with frequency and root cause]

   ### Proposed CLAUDE.md Rules

   [Numbered list of imperative rules to add]

   ### Memory Items

   [Items to persist via reflexion:memorize]

   ### Discarded

   [Items filtered out and why]
   ```

   Ask the user: **"Which of these should I memorize? All, or a subset?"**

### Phase 4: Memorize

After user confirmation, invoke `reflexion:memorize` with the approved findings.

Pass the synthesized, user-approved findings as the source material. The memorize skill will:

- Curate insights into CLAUDE.md under appropriate sections
- Follow ACE grow-and-refine principles (no overwrites, no duplicates)
- Validate quality gates (actionable, specific, evidence-backed)

If the user also wants items saved to personal memory (cross-project learnings), save those to the memory system separately.

## Important Guidelines

1. **Session scope**: This skill operates on the FULL session, not just the last message. Gather all rounds.
2. **Branch awareness**: Run this on the issue branch/worktree, not on main.
3. **User confirmation**: Always get user approval before memorizing. The user decides what's worth keeping.
4. **No auto-fixes**: This is a learning/retrospective tool, not a fix-it tool. It produces knowledge, not code changes.
5. **Prevent rule bloat**: Only add rules that prevent recurring issues. One-off mistakes don't need rules.
6. **Be specific**: "Check sibling files for existing patterns" is better than "follow conventions".
7. **Include the why**: Each rule should explain why it exists so future sessions can judge edge cases.

## Usage

```bash
# After completing all CodeRabbitAI review rounds
/review-retro

# With explicit scope
/review-retro --branch=feat/123-some-feature

# Dry run (show findings without memorizing)
/review-retro --dry-run
```

## Expected Output

1. Consolidated feedback summary (Phase 1)
2. Parallel analysis results from Reflector + Critic (Phase 2)
3. Synthesized, ranked findings with proposed rules (Phase 3)
4. Confirmation prompt before memorizing (Phase 4)
5. Updated CLAUDE.md and/or memory files (Phase 4, after approval)

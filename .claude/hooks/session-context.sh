#!/bin/bash
# Inject branch + worktree context at session start.
set -euo pipefail

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
UNCOMMITTED=$((git status --porcelain 2>/dev/null || echo "") | wc -l | tr -d ' ')

OUTPUT="Branch: $BRANCH"

if [ "$UNCOMMITTED" -gt 0 ]; then
  OUTPUT="$OUTPUT | Uncommitted: $UNCOMMITTED files"
fi

# Detect if we are inside a git worktree (vs the main working tree)
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null || echo "")
GIT_COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null || echo "")

if [ -n "$GIT_DIR" ] && [ "$GIT_DIR" != "$GIT_COMMON_DIR" ]; then
  OUTPUT="$OUTPUT | WORKTREE: $(git rev-parse --show-toplevel 2>/dev/null)"
fi

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  OUTPUT="$OUTPUT | WARNING: on main — use /ralph to pick an issue and create a worktree"
fi

echo "$OUTPUT"
exit 0

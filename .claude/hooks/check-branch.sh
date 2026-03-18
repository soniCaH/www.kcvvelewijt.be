#!/bin/bash
# Block git commits on main/master. Worktree-aware.
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | sed -n 's/.*"command" *: *"\([^"]*\)".*/\1/p')
echo "$COMMAND" | grep -q 'git commit' || exit 0

# In a worktree, git rev-parse --show-toplevel gives the worktree root.
# git branch --show-current works correctly in both worktrees and main tree.
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"BLOCKED: You are on the main branch. Use /ralph to create a worktree for an issue first."}}
EOF
  exit 0
fi

exit 0

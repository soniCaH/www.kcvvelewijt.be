#!/bin/bash
# Block git commits on main/master. Worktree-aware.
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | sed -n 's/.*"command" *: *"\([^"]*\)".*/\1/p')
echo "$COMMAND" | grep -q 'git commit' || exit 0

# If the command starts with "cd /some/path && ...", resolve the branch there.
TARGET_DIR=$(echo "$COMMAND" | sed -n 's/^cd \([^ &]*\) &&.*/\1/p')
if [ -n "$TARGET_DIR" ] && [ -d "$TARGET_DIR" ]; then
  BRANCH=$(git -C "$TARGET_DIR" branch --show-current 2>/dev/null || echo "unknown")
else
  BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
fi

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"BLOCKED: You are on the main branch. Use /ralph to create a worktree for an issue first."}}
EOF
  exit 0
fi

exit 0

#!/bin/bash
# Warn when editing files on main — but allow docs/ and .claude/ writes.
# Planning artifacts (PRDs, skills, commands) legitimately live on main.
set -euo pipefail

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
  exit 0
fi

# Read the file path being written from the hook input
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('path', '') or data.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null || echo "")

# Allow writes to docs/, .claude/, scripts/, and root CLAUDE.md on main
RELATIVE_PATH=$(echo "$FILE_PATH" | sed "s|^$CLAUDE_PROJECT_DIR/||")
if echo "$RELATIVE_PATH" | grep -qE "^(docs/|\.claude/|scripts/|CLAUDE\.md)"; then
  exit 0
fi

# Block everything else on main
cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"BLOCKED: Editing source files on main. Use ./scripts/ralph.sh to create a worktree. (docs/, .claude/, scripts/ are allowed on main)"}}
EOF
exit 0

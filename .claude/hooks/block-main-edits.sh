#!/bin/bash
# Block source edits on main — but allow docs/, .claude/ and scripts/ writes.
# Planning artifacts (PRDs, skills, commands) legitimately live on main.
set -euo pipefail

is_main() { [ "$1" = "main" ] || [ "$1" = "master" ]; }

# Fast path: a session whose checkout is off main only reaches files on its own
# branch or in other worktrees, so it never needs the payload parsed.
is_main "$(git branch --show-current 2>/dev/null || echo unknown)" || exit 0

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

# If file is outside the project directory, it's in a sibling worktree — allow it
if [[ "$FILE_PATH" != "$CLAUDE_PROJECT_DIR/"* ]]; then
  exit 0
fi

# A worktree nested inside the project (e.g. .worktrees/) has its own branch:
# ask the checkout that holds the file. Walk up to the nearest folder that
# exists, since a new file's folder may not yet.
DIR=$(dirname "$FILE_PATH")
while [ ! -d "$DIR" ]; do DIR=$(dirname "$DIR"); done
is_main "$(git -C "$DIR" branch --show-current 2>/dev/null || echo unknown)" || exit 0

# Allow writes to docs/, .claude/, scripts/, and root CLAUDE.md on main
RELATIVE_PATH=${FILE_PATH#"$CLAUDE_PROJECT_DIR"/}
if [[ "$RELATIVE_PATH" =~ ^(docs/|\.claude/|scripts/)|(^|/)CLAUDE\.md$ ]]; then
  exit 0
fi

# Block everything else on main
cat <<JSON
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"BLOCKED: Editing source files on main. Use /ralph-once to create a worktree. (docs/, .claude/, scripts/ are allowed on main)"}}
JSON
exit 0

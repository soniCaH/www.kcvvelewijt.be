#!/usr/bin/env bash
# Refuse a commit whose repository is on main/master.
#
# This is the real backstop. It runs inside git, in the repository the commit
# actually lands in, so it cannot be routed around by `git -C`, `bash -c`,
# xargs, aliases or any quoting trick — unlike a hook that parses a command
# string. It covers humans and non-Claude tooling too.
#
#   Escape hatch:  ALLOW_MAIN_COMMIT=1 git commit -m "…"
#
# Prefer that over `--no-verify`, which also skips commitlint and lint-staged.
#
# Usage: branch-guard.sh [directory]   (defaults to the current directory)
set -uo pipefail

[ "${ALLOW_MAIN_COMMIT:-}" = "1" ] && exit 0

TARGET=${1:-.}

# Empty on a detached HEAD — a detached-HEAD commit cannot advance main.
# Non-zero exit means "not a repository", which is git's problem, not ours.
BRANCH=$(git -C "$TARGET" branch --show-current 2>/dev/null) || exit 0

case "$BRANCH" in
main | master)
  cat >&2 <<EOF

🚫 BLOCKED: that commit would land on '$BRANCH' in $TARGET.

   Use /ralph-once to create a worktree for an issue first.
   If you really meant this one commit: ALLOW_MAIN_COMMIT=1 git commit …

EOF
  exit 1
  ;;
esac

exit 0

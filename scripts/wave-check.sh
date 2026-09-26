#!/bin/bash
# Wave check — do the open PR branches collide with main, or with each other?
#
# Run this after a /ralph-afk wave opens its PRs, BEFORE you start merging.
# It tells you which PRs are safe to merge in any order, and which pairs will
# fight, so you merge the fighters one at a time instead of discovering the
# conflict halfway through.
#
# Usage: ./scripts/wave-check.sh
#
# ponytail: pairwise O(n²) on merge-tree. Fine to ~15 open PRs; if a wave ever
# gets bigger than that, group by changed-file sets first.
set -euo pipefail

git fetch --quiet --prune origin

# ── merge-tree, run once, with the three outcomes kept apart ──────────────────
# Exit 0 = clean, 1 = conflict, anything else = git could not answer. A missing
# ref also exits 1, which is why refs are verified before this is trusted.
# Sets MT_OUT to the conflicted paths (empty when clean).
MT_OUT=""
merge_check() {
  local rc=0 out
  out=$(git merge-tree --write-tree --name-only "$1" "$2" 2>&1) || rc=$?
  if [ "$rc" -gt 1 ]; then
    echo "git merge-tree failed (exit ${rc}) comparing $1 and $2:" >&2
    echo "$out" >&2
    exit 1
  fi
  # Output shape: OID line, then conflicted paths, then a blank line and git's
  # own prose. Drop the OID, stop at the blank line.
  MT_OUT=$(printf '%s\n' "$out" | tail -n +2 | sed -e '/^$/q' -e '/^$/d')
  return "$rc"
}

# ── collect the open PR head branches ─────────────────────────────────────────
# Capture first and check the exit status: a gh failure inside a process
# substitution would otherwise read as "no open PRs" and report all-clear.
# WAVE_CHECK_BRANCHES exists so the fixture test can drive this script without a
# GitHub round-trip: newline-separated branch names, used verbatim in place of
# the `gh` call. Not for interactive use — a hand-typed list silently checks the
# wrong wave.
if [ -n "${WAVE_CHECK_BRANCHES:-}" ]; then
  PR_BRANCHES="${WAVE_CHECK_BRANCHES}"
elif ! PR_BRANCHES=$(gh pr list --state open --limit 100 --json headRefName --jq '.[].headRefName' 2>&1); then
  echo "gh pr list failed: ${PR_BRANCHES}" >&2
  exit 1
fi

# ponytail: while-read, not `mapfile` — macOS ships bash 3.2, which has no mapfile.
BRANCHES=()
while IFS= read -r line; do
  [ -n "$line" ] || continue
  # A PR from a fork has no branch on origin; merge-tree would exit 1 on the
  # missing ref and be misread as a conflict. Say so instead.
  if git rev-parse --verify --quiet "origin/${line}^{commit}" >/dev/null; then
    BRANCHES+=("$line")
  else
    printf "  skipped   %s — no such branch on origin (fork PR?)\n" "$line"
  fi
done <<<"$(printf '%s\n' "$PR_BRANCHES" | sort)"

if [ ${#BRANCHES[@]} -eq 0 ]; then
  echo "No open PRs with a branch on origin."
  exit 0
fi

echo "Open PR branches: ${#BRANCHES[@]}"
echo ""

# ── 1. Does each branch still merge cleanly into main? ────────────────────────
echo "── vs origin/main ──"
CLEAN=()
for b in "${BRANCHES[@]}"; do
  if merge_check "origin/main" "origin/${b}"; then
    printf "  clean     %s\n" "$b"
    CLEAN+=("$b")
  else
    printf "  CONFLICTS %s  → rebase on main before merging\n" "$b"
    printf '%s\n' "$MT_OUT" | sed 's/^/              /'
  fi
done
echo ""

# ── 2. Do any two of the clean ones fight each other? ─────────────────────────
if [ ${#CLEAN[@]} -lt 2 ]; then
  echo "Fewer than two mergeable branches — nothing to compare."
  exit 0
fi

echo "── pairwise ──"
FOUND=0
for ((i = 0; i < ${#CLEAN[@]}; i++)); do
  for ((j = i + 1; j < ${#CLEAN[@]}; j++)); do
    a="${CLEAN[$i]}"
    b="${CLEAN[$j]}"
    if ! merge_check "origin/${a}" "origin/${b}"; then
      printf "  COLLIDE   %s  ↔  %s\n" "$a" "$b"
      # The filenames say whether this is a real fight or just the lockfile.
      printf '%s\n' "$MT_OUT" | sed 's/^/              /'
      FOUND=1
    fi
  done
done

if [ "$FOUND" -eq 0 ]; then
  echo "  none — merge them in any order."
else
  echo ""
  echo "Merge one of each colliding pair, then rebase the other before merging it."
fi
echo ""

# ── 3. Does one branch add a RULE that another branch's new code must satisfy? ─
# merge-tree is blind to this: the two branches share no file, so it reports a
# clean pair and you merge both — then main goes red on the combination. That is
# exactly how #2882 (which added a guard banning English sr-only text) and #2880
# (which added an English sr-only string) took main down, twenty seconds apart,
# each green on its own branch.
#
# ponytail: a heuristic on paths, not a proof. Proving it means merging the pair
# and running the suite, which needs a checkout and an install — everything this
# script deliberately is not. So it names the risk and the one action that
# settles it, and stays read-only.
RULE_SURFACE='(^|/)(eslint\.config\.|commitlint\.config\.)|(^|/)__tests__/[^/]*consistency[^/]*\.test\.ts$|^\.husky/|^\.claude/hooks/'
CODE_SURFACE='^(apps|packages)/[^/]+/src/'

# Files a branch changed relative to where it left main.
changed_files() {
  git diff --name-only "$(git merge-base origin/main "origin/$1")" "origin/$1"
}

echo "── rule vs code (merge-tree cannot see these) ──"
SEMANTIC=0
for a in "${CLEAN[@]}"; do
  a_files=$(changed_files "$a")
  a_rules=$(printf '%s\n' "$a_files" | grep -E "$RULE_SURFACE" || true)
  [ -n "$a_rules" ] || continue

  consumers=()
  for b in "${CLEAN[@]}"; do
    [ "$b" != "$a" ] || continue
    if changed_files "$b" | grep -qE "$CODE_SURFACE"; then
      consumers+=("$b")
    fi
  done
  [ ${#consumers[@]} -gt 0 ] || continue

  SEMANTIC=1
  printf "  RULE      %s changes a rule surface:\n" "$a"
  printf '%s\n' "$a_rules" | sed 's/^/              /'
  printf "            these branches add code that rule will scan:\n"
  printf '              %s\n' "${consumers[@]}"
done

if [ "$SEMANTIC" -eq 0 ]; then
  echo "  none — no branch in this wave adds a rule another one must satisfy."
else
  echo ""
  echo "Whichever of a listed pair you merge SECOND must be re-checked against the"
  echo "updated main before it lands: merge origin/main into it and run"
  echo "\`pnpm turbo run lint type-check test build --filter=...<workspace>\` for the"
  echo "workspace the rule covers. Re-running its old CI is not enough —"
  echo "a PR's checks are computed against the main it forked from, and"
  echo "\`gh run rerun\` replays that same stale merge."
fi

#!/usr/bin/env bash
# Vercel "Ignored Build Step" (apps/web/vercel.json `ignoreCommand`), run from
# apps/web. Exit 0 skips the deployment, exit 1 builds it. Vercel fails the
# deploy on any other code (#3604), so every path below ends in `exit 0` or
# `exit 1`, and every case the script cannot decide builds (fail open).
#
# Each build costs money. The team is on Vercel Pro (since 2026-11-08), which
# bills build CPU minutes, and every deployment also keeps its own copy of the
# functions (Functions Storage filled up on Hobby on 2026-10-19). So we skip
# what nobody opens or what ships nothing new:
#   - the VR bot's diff branches (screenshots for review only);
#   - bot branches (renovate/, dependabot/, imgbot/), which GitHub CI already
#     tests. They build only when the commit starts with 💥 (major) or 🔒
#     (security), or when the PR has the `preview` label (#3743). Add the label,
#     then Redeploy the skipped deployment: Redeploy re-runs this script.
#   - a push that changes nothing the web app builds from (apps/api, research
#     notes, docs), compared against the branch's last successful deploy, or
#     against main on a branch's first push.
set -u

ref="${VERCEL_GIT_COMMIT_REF:-}"
previous="${VERCEL_GIT_PREVIOUS_SHA:-}"

case "$ref" in
  vr-diffs/*) exit 0 ;;
esac

# A redeploy of the same commit (an env-var change, a manual "Redeploy") is
# always meant to build.
[ -z "$previous" ] || [ "$previous" != "${VERCEL_GIT_COMMIT_SHA:-}" ] || exit 1

case "$ref" in
  renovate/* | dependabot/* | imgbot/*)
    case "${VERCEL_GIT_COMMIT_MESSAGE:-}" in
      💥* | 🔒*) exit 1 ;;
    esac
    # Renovate pushes the branch before it opens the PR: nothing to label yet.
    [ -n "${VERCEL_GIT_PULL_REQUEST_ID:-}" ] || exit 0
    # Public repo, no token. An API error or rate limit builds.
    labels=$(curl -fsS --max-time 10 \
      "https://api.github.com/repos/soniCaH/www.kcvvelewijt.be/issues/$VERCEL_GIT_PULL_REQUEST_ID/labels") || exit 1
    if printf '%s' "$labels" | grep -Eq '"name": ?"preview"'; then
      exit 1
    fi
    exit 0
    ;;
esac

# First push of a branch: no previous successful deploy, so compare against
# main. Vercel's clone is shallow and may not hold main: fetch it, and build
# if that fails. Main itself always builds. A branch that is behind main on
# web paths also builds, which is the safe direction.
if [ -z "$previous" ]; then
  [ "$ref" != "main" ] || exit 1
  GIT_TERMINAL_PROMPT=0 git fetch -q --depth=1 origin main 2>/dev/null || exit 1
  previous=FETCH_HEAD
fi

# No change to the web app or anything it builds from: skip. Anything else
# builds — including a git error (the previous SHA gone after a force-push),
# which exits 128.
if git diff --quiet "$previous" HEAD -- \
  . ../../packages ../../package.json ../../pnpm-lock.yaml \
  ../../pnpm-workspace.yaml ../../turbo.json ../../.npmrc; then
  exit 0
fi
exit 1

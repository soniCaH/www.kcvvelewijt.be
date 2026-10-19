#!/usr/bin/env bash
# Vercel "Ignored Build Step" (apps/web/vercel.json `ignoreCommand`), run from
# apps/web. Exit 0 skips the deployment, anything else builds it.
#
# Every deployment keeps its own copy of the functions, and Hobby allows 10 GB
# of Functions Storage in total. Pushes that change nothing the web app ships
# (apps/api, research notes, the VR bot's diff branches) built a full copy each
# and pushed the project over the limit (2026-10-19). An api-only deploy also
# reset the prerendered homepage to its last web build.
set -u

# The VR bot's diff branches only carry screenshots for review.
case "${VERCEL_GIT_COMMIT_REF:-}" in
  vr-diffs/*) exit 0 ;;
esac

# First deploy of a branch: no previous deploy to compare against, so build.
[ -n "${VERCEL_GIT_PREVIOUS_SHA:-}" ] || exit 1

# A redeploy of the same commit (an env-var change, a manual "Redeploy") is
# always meant to build.
[ "$VERCEL_GIT_PREVIOUS_SHA" != "${VERCEL_GIT_COMMIT_SHA:-}" ] || exit 1

# No change to the web app or anything it builds from: skip. A git error (the
# previous SHA missing from a shallow clone) exits non-zero, so it builds.
git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- \
  . ../../packages ../../package.json ../../pnpm-lock.yaml \
  ../../pnpm-workspace.yaml ../../turbo.json ../../.npmrc

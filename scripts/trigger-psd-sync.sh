#!/bin/bash
# Trigger the PSD → Sanity sync for ONE team, by hand.
#
# The nightly cron (02:00 UTC) walks one team per night. This is for when an
# editor has just filled in portraits or positions in ProSoccerData and wants
# them on the site now, without waiting for tonight.
#
# Usage: ./scripts/trigger-psd-sync.sh <team-index>
#        ./scripts/trigger-psd-sync.sh 0      # 0 = Eerste Elftallen A (PSD id 1)
#
# The index is a POSITION in PSD's getRawTeams() response, not a stable team id.
# PSD does not document that ordering, so adding or reordering a team silently
# shifts every index after it. The run prints `processing team N/21: <id> (<name>)`
# — read it, and stop the run if it names a team you did not mean. Verified on
# 2026-09-09: index 0 = id 1 Eerste Elftallen A, index 1 = id 2 Eerste Elftallen B.
#
# IT WRITES TO PRODUCTION SANITY. The cursor lives in the *preview* KV namespace
# because `wrangler dev --remote` reads preview, but the Sanity credentials come
# from apps/api/.dev.vars, which points at the production dataset. Preview KV,
# production data. The script prints the target before it writes so you can see
# this rather than remember it.
#
# A 429 on a portrait upload is NOT fatal — that player retries on the nightly
# cron, or on your next run of this script.
#
# ponytail: polls a log file rather than exposing a status endpoint. The worker
# has no health route and adding one for a hand-run operator tool is not worth
# it; if this ever needs to be non-interactive, give the worker a /healthz.
set -euo pipefail

# Job control, so the server we launch becomes its own process-group leader and
# `kill -- -PID` reaches the whole tree. Without it, killing the wrapper leaves
# the real server orphaned and still holding the port — `pnpm exec` spawns
# wrangler as a child, and wrangler spawns workerd under that.
set -m

REPO_ROOT="$(git rev-parse --show-toplevel)"
API_DIR="${REPO_ROOT}/apps/api"

TEAM_INDEX="${1:-}"
if [ -z "${TEAM_INDEX}" ] || ! [[ "${TEAM_INDEX}" =~ ^[0-9]+$ ]]; then
  echo "usage: ./scripts/trigger-psd-sync.sh <team-index>" >&2
  echo "       0 = Eerste Elftallen A, 1 = Eerste Elftallen B, …" >&2
  echo "       (a position in PSD's team list, not a team id — check the run's" >&2
  echo "        'processing team N/M: <id> (<name>)' line)" >&2
  exit 64
fi

PORT="${TRIGGER_PSD_SYNC_PORT:-8800}"
CRON="0 2 * * *"
CURSOR_KEY="sync:team-cursor"

# How long to wait for the sync to report `done` before giving up and
# summarising what did land.
#
# `scheduled()` now AWAITS the sync (#2900) rather than firing it via
# ctx.waitUntil() and returning immediately — that used to confine the whole
# run to the ~30s grace period Cloudflare grants *after* an invocation ends,
# which killed a team whose photos all changed partway through every time
# (#2890's bug, still worth not repeating: killing wrangler early cancels
# uploads still in flight). Awaited, the real ceiling is the Workers Paid
# plan's Cron Trigger wall-clock limit for this daily (>= 1h interval) cron —
# 15 minutes, not a guessed number. Match it exactly rather than re-guessing:
# https://developers.cloudflare.com/workers/platform/limits/
READY_TIMEOUT_S=120
SYNC_TIMEOUT_S=900

# Fixture hook for apps/web/test/hooks/trigger-psd-sync.test.ts: replaces the
# wrangler launch with a stub server AND skips the KV cursor write, so the test
# can assert the cron fires exactly once without a Cloudflare round-trip. Not
# for interactive use — with this set, nothing real is synced.
SERVER_CMD="${TRIGGER_PSD_SYNC_SERVER_CMD:-}"

LOG="${TRIGGER_PSD_SYNC_LOG:-$(mktemp -t psd-sync.XXXXXX)}"
: >"${LOG}"

# ── say where this is about to write ──────────────────────────────────────────
# Read from .dev.vars first: `wrangler dev` prefers it over wrangler.toml's
# [vars], so it is what actually takes effect. Note this is NOT the same source
# apps/web/.env.local uses — that one points at `staging`, and reading it to
# verify a sync silently queries the wrong dataset (#2890).
# `|| true` is load-bearing. The body ends in a pipeline, so under
# `set -euo pipefail` a grep that matches nothing returns non-zero, and
# `PROJECT_ID="$(read_var …)"` is a bare assignment that `set -e` aborts on.
# The normal operator case hits it: `.dev.vars` exists holding only secrets
# while the ids live in `wrangler.toml [vars]` — the script would die here with
# no output at all, and the wrangler.toml fallback below could never run.
read_var() {
  local key="$1" file="$2"
  [ -f "${file}" ] || return 0
  { grep -E "^[[:space:]]*${key}[[:space:]]*=" "${file}" | head -1 |
    sed -E "s/^[^=]*=[[:space:]]*//; s/^[\"']//; s/[\"'][[:space:]]*$//"; } || true
}

PROJECT_ID="$(read_var SANITY_PROJECT_ID "${API_DIR}/.dev.vars")"
DATASET="$(read_var SANITY_DATASET "${API_DIR}/.dev.vars")"
[ -n "${PROJECT_ID}" ] || PROJECT_ID="$(read_var SANITY_PROJECT_ID "${API_DIR}/wrangler.toml")"
[ -n "${DATASET}" ] || DATASET="$(read_var SANITY_DATASET "${API_DIR}/wrangler.toml")"

echo "──────────────────────────────────────────────"
echo " PSD → Sanity sync, team index ${TEAM_INDEX}"
echo " Sanity project : ${PROJECT_ID:-<unknown>}"
echo " Sanity dataset : ${DATASET:-<unknown>}"
if [ "${DATASET}" = "production" ]; then
  echo " ⚠  This writes to PRODUCTION. Not a dry run."
fi
echo " Log            : ${LOG}"
echo "──────────────────────────────────────────────"

# ── point the cursor at the requested team ────────────────────────────────────
# --preview is not optional. `wrangler dev --remote` reads the PREVIEW KV
# namespace; without the flag this writes production KV and the run syncs
# whatever team the preview cursor happened to be on.
if [ -n "${SERVER_CMD}" ]; then
  echo "fixture mode — skipping the KV cursor write"
else
  echo "setting cursor to ${TEAM_INDEX}…"
  (cd "${API_DIR}" && pnpm exec wrangler kv key put \
    --binding PSD_CACHE --preview "${CURSOR_KEY}" "${TEAM_INDEX}" --remote >/dev/null)
fi

# ── start the worker ──────────────────────────────────────────────────────────
if [ -n "${SERVER_CMD}" ]; then
  ( eval "${SERVER_CMD}" ) >>"${LOG}" 2>&1 &
else
  (cd "${API_DIR}" && pnpm exec wrangler dev --remote --test-scheduled \
    --port "${PORT}") >>"${LOG}" 2>&1 &
fi
SERVER_PID=$!
# Set once curl is actually backgrounded below. Declared here (empty, not
# unset) so cleanup() can reference it safely under `set -u` even if it runs
# before that point (e.g. the readiness loop below fails first).
CURL_PID=""

# Kill the process GROUP first (see `set -m` above). Falling back to the bare
# PID keeps this working if job control is ever unavailable, at the cost of
# possibly orphaning a child.
cleanup() {
  kill "${CURL_PID}" 2>/dev/null || true
  kill -- -"${SERVER_PID}" 2>/dev/null || kill "${SERVER_PID}" 2>/dev/null || true
  wait "${SERVER_PID}" 2>/dev/null || true
}
trap cleanup EXIT

# ── wait for readiness WITHOUT firing the cron ────────────────────────────────
# `/__scheduled` is the trigger, not a health endpoint — probing it *is* running
# the sync. An earlier ad-hoc version used it as its readiness check and fired
# two concurrent syncs over the same team (#2890). Watch the log instead: it
# costs no request at all.
echo "waiting for the worker…"
ready=0
for _ in $(seq 1 "${READY_TIMEOUT_S}"); do
  if grep -q "Ready on http://localhost:${PORT}" "${LOG}"; then
    ready=1
    break
  fi
  if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
    echo "the worker exited before it was ready — see ${LOG}" >&2
    exit 1
  fi
  sleep 1
done
if [ "${ready}" -ne 1 ]; then
  echo "the worker never reported ready within ${READY_TIMEOUT_S}s — see ${LOG}" >&2
  exit 1
fi

# ── fire the cron, exactly once ───────────────────────────────────────────────
echo "firing the sync…"
# Backgrounded, not foreground (#2900 review): scheduled() now awaits the sync
# itself (see the SYNC_TIMEOUT_S comment above), so this request blocks for
# the sync's FULL duration rather than returning immediately the way it used
# to. Foregrounding it here would make the poll loop below, its
# SYNC_TIMEOUT_S bound, and its liveness guard all unreachable — curl would
# already have returned by the time any of them ran. --max-time bounds it
# independently of the poll loop, and `|| true` under `set -e` means a
# curl-level failure (e.g. the worker dying mid-request) can't abort the
# script before the "what did land" summary below gets to print.
(curl -sS --max-time "${SYNC_TIMEOUT_S}" --get "http://localhost:${PORT}/__scheduled" \
  --data-urlencode "cron=${CRON}" -o /dev/null || true) &
CURL_PID=$!

# ── wait for the sync's own completion line ───────────────────────────────────
# `team <id> (<name>): done` is NOT the end of the pass — after it the effect
# still writes three KV cycle-id keys, may run reconciliation, and advances the
# cursor. Stopping there cancels all of that mid-flight, which is the exact
# truncation this script exists to avoid. `sync completed — cursor advanced to N`
# (psd-sanity-sync.ts) is the genuine terminal line.
echo "waiting for the sync to finish (up to ${SYNC_TIMEOUT_S}s)…"
finished=0
failed=0
for _ in $(seq 1 "${SYNC_TIMEOUT_S}"); do
  if grep -q "cursor advanced to" "${LOG}"; then
    finished=1
    break
  fi
  # Same liveness guard the readiness loop has: a crashed worker or a failed
  # sync should report now, not after the full timeout.
  if grep -q "Sync failed:" "${LOG}"; then
    failed=1
    break
  fi
  if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
    echo "the worker exited before the sync finished — see ${LOG}" >&2
    break
  fi
  sleep 1
done

cleanup
trap - EXIT

# ── summary ───────────────────────────────────────────────────────────────────
# `|| true` is load-bearing: under `set -euo pipefail` a grep that matches
# nothing fails the whole pipeline and kills the script — so a clean run with
# zero 429s would die here instead of printing the summary.
count() {
  grep -oE "$1" "${LOG}" 2>/dev/null | grep -oE '[0-9]+' | sort -u | wc -l |
    tr -d ' ' || true
}

TEAM_LINE="$(grep -oE "processing team [0-9]+/[0-9]+: .*" "${LOG}" | head -1 || true)"
ROSTER="$(grep -oE "team [0-9]+: [0-9]+ players, [0-9]+ staff" "${LOG}" | head -1 || true)"
# Players and staff each get their own patterns: mutation.ts (#2895) keeps
# the player log lines byte-identical ("[uploadPlayerImage] player=…") and
# gives staff its own ("[uploadStaffImage] staff=…", "staff <id>: …") rather
# than reusing the player wording, specifically so these can stay separate
# counts instead of silently merging two different rosters into one number.
COMMITTED_PLAYERS="$(count 'player=[0-9]+ patch committed')"
COMMITTED_STAFF="$(count 'staff=[0-9]+ patch committed')"
UPTODATE_PLAYERS="$(count 'player [0-9]+: image up-to-date')"
UPTODATE_STAFF="$(count 'staff [0-9]+: image up-to-date')"
PLACEHOLDER_PLAYERS="$(count 'player=[0-9]+ bytes match PSD')"
PLACEHOLDER_STAFF="$(count 'staff=[0-9]+ bytes match PSD')"
# Anchored to the actual failure text AND to the "player "/"staff " prefix
# psd-sanity-sync.ts logs it under. A bare 'image upload failed.*429' used to
# match both rosters identically, so a run where only staff hit a 429 printed
# it as a player-side failure that never happened (#2895 review). A bare
# '429' alone matches a timestamp (11:37:46.429Z), a body_bytes value, or a
# sha1 — a clean run reported one phantom rate limit that way.
RATE_LIMITED_PLAYERS="$(grep -c 'player [0-9]*: image upload failed.*429' "${LOG}" || true)"
RATE_LIMITED_STAFF="$(grep -c 'staff [0-9]*: image upload failed.*429' "${LOG}" || true)"
FIRED="$(grep -c 'processing team [0-9]*/' "${LOG}" || true)"

echo
echo "──────────────────────────────────────────────"
[ -n "${TEAM_LINE}" ] && echo " ${TEAM_LINE}"
[ -n "${ROSTER}" ] && echo " ${ROSTER}"
echo " images committed        : players ${COMMITTED_PLAYERS}, staff ${COMMITTED_STAFF}"
echo " already up to date      : players ${UPTODATE_PLAYERS}, staff ${UPTODATE_STAFF}"
echo " PSD placeholder skipped : players ${PLACEHOLDER_PLAYERS}, staff ${PLACEHOLDER_STAFF}   (name/illustration fallback renders)"
echo " rate-limited (429)      : players ${RATE_LIMITED_PLAYERS}, staff ${RATE_LIMITED_STAFF}   (non-fatal, retries next run)"
echo "──────────────────────────────────────────────"

if [ "${FIRED}" -gt 1 ]; then
  echo "⚠  the sync ran ${FIRED} times in one invocation — it must run once. See ${LOG}" >&2
  exit 1
fi

if [ "${failed}" -eq 1 ]; then
  echo "⚠  the sync reported a failure. Whatever committed above is safe." >&2
  grep -m3 'Sync failed:' "${LOG}" >&2 || true
  echo "   Log: ${LOG}" >&2
  exit 1
fi

if [ "${finished}" -ne 1 ]; then
  echo "⚠  the sync's ${SYNC_TIMEOUT_S}s budget ran out before it finished." >&2
  echo "   This is not a hang — it is Cloudflare's own Cron Trigger ceiling," >&2
  echo "   and an unusually large team (e.g. every photo changed) can still" >&2
  echo "   exceed it. Whatever committed above is safe, and it checkpoints as" >&2
  echo "   it goes (#2900): a re-run resumes past those members rather than" >&2
  echo "   re-walking the team from the start." >&2
  echo "   Log: ${LOG}" >&2
  exit 1
fi

echo "done. log: ${LOG}"

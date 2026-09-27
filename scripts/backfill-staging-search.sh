#!/bin/bash
# Backfill the STAGING search index from the staging Sanity dataset, by hand.
#
# Staging search is pull-only by choice (#2845): no cron, no webhook. Nothing
# fills `kcvv-search-staging` on its own, so run this whenever staging search
# should catch up with the staging dataset.
#
# Usage: ./scripts/backfill-staging-search.sh
#
# Run it from a checkout that has apps/api/.dev.vars (or .dev.vars.staging) —
# a fresh worktree has neither, and the script refuses rather than start a
# worker with no Sanity token.
#
# What it does, in one call: starts the staging worker with remote bindings
# (`wrangler dev --env staging --remote --test-scheduled`), waits until it is
# up, fires the `30 2 * * *` scheduled handler ONCE (the search-index sweep —
# never the `0 2 * * *` PSD sync), waits for the sweep to settle, stops the
# worker, and prints the index's vector count. Exits non-zero if the sweep
# failed or never settled.
#
# WHAT IT WRITES: vectors in the Vectorize index `kcvv-search-staging`, the
# sweep's manifest keys in staging KV, and Workers AI embedding calls. It
# reads the staging Sanity dataset. It never touches `kcvv-search`.
#
# The dataset comes from wrangler.toml, not .dev.vars. `wrangler dev` lets
# .dev.vars override [env.staging.vars], and the usual .dev.vars points at
# `production` — so the worker would pair the production dataset with the
# staging index, and the dataset/index guard would refuse the sweep. This
# script hands wrangler a copy of .dev.vars without SANITY_DATASET and
# SEARCH_INDEX_NAME (`--env-file` makes wrangler skip .dev.vars), so the
# secrets still load and the two guarded values come from wrangler.toml.
#
# ponytail: polls a log file for readiness and completion, same as
# trigger-psd-sync.sh — the worker has no health route.
set -euo pipefail

# Job control, so `kill -- -PID` reaches wrangler and workerd under it. See
# trigger-psd-sync.sh for the orphaned-port bug this prevents.
set -m

REPO_ROOT="$(git rev-parse --show-toplevel)"
API_DIR="${REPO_ROOT}/apps/api"

EXPECTED_DATASET="staging"
EXPECTED_INDEX="kcvv-search-staging"
CRON="30 2 * * *"
PORT="${BACKFILL_STAGING_SEARCH_PORT:-8801}"
READY_TIMEOUT_S=120
# The sweep is awaited inside scheduled() (#2845), so its ceiling is the Cron
# Trigger's 15-minute wall clock. Match it.
SWEEP_TIMEOUT_S=900

# Fixture hooks for apps/web/test/hooks/backfill-staging-search.test.ts. With
# the server command set, a stub replaces wrangler and nothing reaches
# Cloudflare. Not for interactive use.
SERVER_CMD="${BACKFILL_STAGING_SEARCH_SERVER_CMD:-}"
WRANGLER_TOML="${BACKFILL_STAGING_SEARCH_WRANGLER_TOML:-${API_DIR}/wrangler.toml}"
DEV_VARS_DIR="${BACKFILL_STAGING_SEARCH_DEV_VARS_DIR:-${API_DIR}}"
POLL_S="${BACKFILL_STAGING_SEARCH_POLL_S:-1}"

# ── read the target from the config wrangler will actually use ────────────────
# Prints the value of <key> inside the TOML table <header>, or nothing. The
# table ends at the next line that starts with `[`.
toml_value() {
  local header="$1" key="$2"
  awk -v header="${header}" -v key="${key}" '
    $0 == header { inside = 1; next }
    /^\[/ { inside = 0 }
    inside && $0 ~ "^[[:space:]]*" key "[[:space:]]*=" {
      sub(/^[^=]*=[[:space:]]*"/, ""); sub(/".*$/, ""); print; exit
    }' "${WRANGLER_TOML}"
}

DATASET="$(toml_value '[env.staging.vars]' SANITY_DATASET)"
INDEX_VAR="$(toml_value '[env.staging.vars]' SEARCH_INDEX_NAME)"
INDEX_BINDING="$(toml_value '[[env.staging.vectorize]]' index_name)"

echo "──────────────────────────────────────────────"
echo " Staging search backfill (cron ${CRON})"
echo " Vectorize index : ${INDEX_BINDING:-<unknown>}"
echo " Sanity dataset  : ${DATASET:-<unknown>}"
echo "──────────────────────────────────────────────"

if [ "${DATASET}" != "${EXPECTED_DATASET}" ] ||
  [ "${INDEX_VAR}" != "${EXPECTED_INDEX}" ] ||
  [ "${INDEX_BINDING}" != "${EXPECTED_INDEX}" ]; then
  echo "refusing: ${WRANGLER_TOML} must give staging dataset '${EXPECTED_DATASET}'" >&2
  echo "and index '${EXPECTED_INDEX}' (SEARCH_INDEX_NAME='${INDEX_VAR}'," >&2
  echo "[[env.staging.vectorize]].index_name='${INDEX_BINDING}')." >&2
  exit 1
fi

# ── secrets without the two guarded values ────────────────────────────────────
# Same lookup wrangler does: .dev.vars.staging first, then .dev.vars.
DEV_VARS=""
for candidate in "${DEV_VARS_DIR}/.dev.vars.staging" "${DEV_VARS_DIR}/.dev.vars"; do
  if [ -f "${candidate}" ]; then
    DEV_VARS="${candidate}"
    break
  fi
done
if [ -z "${DEV_VARS}" ]; then
  echo "refusing: no .dev.vars.staging or .dev.vars in ${DEV_VARS_DIR}." >&2
  echo "Without it the worker has no Sanity token. Run this from the main" >&2
  echo "checkout, or copy apps/api/.dev.vars into this one." >&2
  exit 1
fi
# With this set to false, wrangler ignores --env-file AND .dev.vars, so the
# worker would start with no secrets at all.
if [ "${CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV:-}" = "false" ]; then
  echo "refusing: CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV=false makes wrangler skip" >&2
  echo "the secrets file. Unset it and run again." >&2
  exit 1
fi

LOG="${BACKFILL_STAGING_SEARCH_LOG:-$(mktemp -t staging-search.XXXXXX)}"
: >"${LOG}"
echo " Secrets from    : ${DEV_VARS} (dataset and index lines dropped)"
echo " Log             : ${LOG}"

# Drops every dotenv spelling of the two keys: `KEY=`, `KEY =`, `KEY:` and
# `export KEY=`.
ENV_FILE="$(mktemp -t staging-search-vars.XXXXXX)"
grep -vE '^[[:space:]]*(export[[:space:]]+)?(SANITY_DATASET|SEARCH_INDEX_NAME)[[:space:]]*[=:]' \
  "${DEV_VARS}" >"${ENV_FILE}" || true
# --env-file runs dotenv-expand, which .dev.vars does not: a `$` in a secret
# may expand to something else in this run only.
if grep -q '\$' "${ENV_FILE}"; then
  echo "⚠  ${DEV_VARS} contains a '\$'. --env-file expands it; if auth fails, check that secret." >&2
fi

# ── start the worker ──────────────────────────────────────────────────────────
if [ -n "${SERVER_CMD}" ]; then
  echo "fixture mode — no wrangler, no Cloudflare"
  # The stub reads the filtered secrets file from here, so the test can check
  # what wrangler would have been handed.
  ( export BACKFILL_STAGING_SEARCH_ENV_FILE="${ENV_FILE}"; eval "${SERVER_CMD}" ) >>"${LOG}" 2>&1 &
else
  (cd "${API_DIR}" && pnpm exec wrangler dev --env staging --remote \
    --test-scheduled --config "${WRANGLER_TOML}" --port "${PORT}" \
    --env-file "${ENV_FILE}") >>"${LOG}" 2>&1 &
fi
SERVER_PID=$!
CURL_PID=""

cleanup() {
  kill "${CURL_PID}" 2>/dev/null || true
  kill -- -"${SERVER_PID}" 2>/dev/null || kill "${SERVER_PID}" 2>/dev/null || true
  wait "${SERVER_PID}" 2>/dev/null || true
  rm -f "${ENV_FILE}"
}
trap cleanup EXIT

# ── wait for readiness WITHOUT firing the cron ────────────────────────────────
# `/__scheduled` is the trigger, not a health check (#2890). Watch the log.
echo "waiting for the worker…"
deadline=$((SECONDS + READY_TIMEOUT_S))
until grep -q "Ready on http://localhost:${PORT}" "${LOG}"; do
  if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
    echo "the worker exited before it was ready — see ${LOG}" >&2
    exit 1
  fi
  if [ "${SECONDS}" -ge "${deadline}" ]; then
    echo "the worker never reported ready within ${READY_TIMEOUT_S}s — see ${LOG}" >&2
    exit 1
  fi
  sleep "${POLL_S}"
done

# ── fire the search-index cron, exactly once ──────────────────────────────────
# Backgrounded: scheduled() awaits the sweep, so this request blocks for the
# sweep's full length. The poll loop below owns the timeout and the liveness
# check; `|| true` keeps a curl error from aborting before the summary.
echo "firing the search-index sweep…"
(curl -sS --max-time "${SWEEP_TIMEOUT_S}" --get "http://localhost:${PORT}/__scheduled" \
  --data-urlencode "cron=${CRON}" -o /dev/null || true) &
CURL_PID=$!

# ── wait for the sweep's terminal line ────────────────────────────────────────
# index.ts logs `[scheduled] sanity-index-sync settled: ok|failed` after the
# sweep AND its job-alert reports, so stopping the worker then cuts nothing.
echo "waiting for the sweep to settle (up to ${SWEEP_TIMEOUT_S}s)…"
outcome=""
died=0
deadline=$((SECONDS + SWEEP_TIMEOUT_S))
while [ "${SECONDS}" -lt "${deadline}" ]; do
  outcome="$(grep -oE 'sanity-index-sync settled: (ok|failed)' "${LOG}" | head -1 |
    sed 's/.*: //' || true)"
  [ -z "${outcome}" ] || break
  if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
    died=1
    break
  fi
  sleep "${POLL_S}"
done

cleanup
trap - EXIT

# ── summary ───────────────────────────────────────────────────────────────────
# `Indexed X/Y` and `dropped N` say what actually landed — a sweep can settle
# `ok` with part of a chunk dropped.
echo
grep -E '\[search-sync\] (Indexed|Upsert failed|Pruned|refusing)' "${LOG}" || true

if [ "${outcome}" != "ok" ]; then
  if [ "${outcome}" = "failed" ]; then
    echo "⚠  the sweep failed." >&2
    grep -m3 -E 'sanity-index-sync failed:|refusing to sync' "${LOG}" >&2 || true
  elif [ "${died}" -eq 1 ]; then
    echo "⚠  the worker exited before the sweep settled." >&2
  else
    echo "⚠  the sweep did not settle within ${SWEEP_TIMEOUT_S}s." >&2
  fi
  echo "   Log: ${LOG}" >&2
  exit 1
fi

if [ -z "${SERVER_CMD}" ]; then
  # The count lags an upsert by minutes (eventual consistency) — a low number
  # right after a run is not a failure. Check again later if it looks off.
  echo
  (cd "${API_DIR}" && pnpm exec wrangler vectorize info "${EXPECTED_INDEX}")
fi

echo "done. log: ${LOG}"

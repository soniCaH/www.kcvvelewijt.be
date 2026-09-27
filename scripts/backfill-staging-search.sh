#!/bin/bash
# Backfill the STAGING search index from the staging Sanity dataset, by hand.
#
# Staging search is pull-only by choice (#2845): no cron, no webhook. Nothing
# fills `kcvv-search-staging` on its own, so run this whenever staging search
# should catch up with the staging dataset.
#
# Usage: ./scripts/backfill-staging-search.sh
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
SWEEP_TIMEOUT_S=900

# Fixture hooks for apps/web/test/hooks/backfill-staging-search.test.ts:
# replace the wrangler launch with a stub server and skip every Cloudflare
# call. Not for interactive use — with the server command set, nothing is
# indexed.
SERVER_CMD="${BACKFILL_STAGING_SEARCH_SERVER_CMD:-}"
WRANGLER_TOML="${BACKFILL_STAGING_SEARCH_WRANGLER_TOML:-${API_DIR}/wrangler.toml}"

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

LOG="${BACKFILL_STAGING_SEARCH_LOG:-$(mktemp -t staging-search.XXXXXX)}"
: >"${LOG}"
echo " Log             : ${LOG}"

# ── secrets without the two guarded values ────────────────────────────────────
# Same lookup wrangler does: .dev.vars.staging first, then .dev.vars.
ENV_FILE=""
# The `${arr[@]+…}` form at the use site: macOS /bin/bash is 3.2, where an
# empty array under `set -u` is an unbound-variable error.
ENV_FILE_ARGS=()
if [ -z "${SERVER_CMD}" ]; then
  for candidate in "${API_DIR}/.dev.vars.staging" "${API_DIR}/.dev.vars"; do
    if [ -f "${candidate}" ]; then
      ENV_FILE="$(mktemp -t staging-search-vars.XXXXXX)"
      grep -vE '^[[:space:]]*(SANITY_DATASET|SEARCH_INDEX_NAME)[[:space:]]*=' \
        "${candidate}" >"${ENV_FILE}" || true
      ENV_FILE_ARGS=(--env-file "${ENV_FILE}")
      echo " Secrets from    : ${candidate} (dataset and index lines dropped)"
      break
    fi
  done
fi

# ── start the worker ──────────────────────────────────────────────────────────
if [ -n "${SERVER_CMD}" ]; then
  echo "fixture mode — no wrangler, no Cloudflare"
  ( eval "${SERVER_CMD}" ) >>"${LOG}" 2>&1 &
else
  (cd "${API_DIR}" && pnpm exec wrangler dev --env staging --remote \
    --test-scheduled --config "${WRANGLER_TOML}" --port "${PORT}" \
    ${ENV_FILE_ARGS[@]+"${ENV_FILE_ARGS[@]}"}) >>"${LOG}" 2>&1 &
fi
SERVER_PID=$!
CURL_PID=""

cleanup() {
  kill "${CURL_PID}" 2>/dev/null || true
  kill -- -"${SERVER_PID}" 2>/dev/null || kill "${SERVER_PID}" 2>/dev/null || true
  wait "${SERVER_PID}" 2>/dev/null || true
  [ -z "${ENV_FILE}" ] || rm -f "${ENV_FILE}"
}
trap cleanup EXIT

# ── wait for readiness WITHOUT firing the cron ────────────────────────────────
# `/__scheduled` is the trigger, not a health check (#2890). Watch the log.
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

# ── fire the search-index cron, exactly once ──────────────────────────────────
# The handler hands the sweep to ctx.waitUntil() and returns, so the request
# comes back before the sweep ends. Backgrounded anyway, like the peer, so a
# hung request can never block the poll loop below.
echo "firing the search-index sweep…"
(curl -sS --max-time "${SWEEP_TIMEOUT_S}" --get "http://localhost:${PORT}/__scheduled" \
  --data-urlencode "cron=${CRON}" -o /dev/null || true) &
CURL_PID=$!

# ── wait for the sweep's terminal line ────────────────────────────────────────
# index.ts logs `[scheduled] sanity-index-sync settled: ok|failed` after the
# sweep AND its job-alert reports, so stopping the worker then cuts nothing.
echo "waiting for the sweep to settle (up to ${SWEEP_TIMEOUT_S}s)…"
outcome=""
for _ in $(seq 1 "${SWEEP_TIMEOUT_S}"); do
  outcome="$(grep -oE 'sanity-index-sync settled: (ok|failed)' "${LOG}" | head -1 |
    sed 's/.*: //' || true)"
  [ -z "${outcome}" ] || break
  if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
    echo "the worker exited before the sweep settled — see ${LOG}" >&2
    break
  fi
  sleep 1
done

cleanup
trap - EXIT

# ── summary ───────────────────────────────────────────────────────────────────
echo
grep -E '\[search-sync\] (Indexing|Pruned|refusing)' "${LOG}" || true

if [ "${outcome}" != "ok" ]; then
  if [ "${outcome}" = "failed" ]; then
    echo "⚠  the sweep failed." >&2
    grep -m3 -E 'sanity-index-sync failed:|refusing to sync' "${LOG}" >&2 || true
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

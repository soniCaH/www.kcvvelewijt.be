#!/usr/bin/env node
/**
 * Syncs the KCVV analytics taxonomy into the live GTM container (issue #1974).
 *
 * It idempotently upserts, in a GTM **workspace** only:
 *   1. the Custom-Event trigger's Event-name RegEx (= taxonomy `buildTriggerRegex()`),
 *   2. one Data Layer Variable per taxonomy param (deduped by dataLayer key),
 *   3. the GA4 Event tag's custom-parameter rows (deduped by param name),
 * then creates an **unpublished** container version. Nothing is auto-published —
 * you review the version diff in the GTM UI and publish.
 *
 * SAFETY
 *   --dry-run   Print the full plan (creates/updates) + the orphan report and
 *               exit WITHOUT writing anything.
 *   --dump      Read-only: print the live trigger, GA4 tag, and DLVs as JSON,
 *               so the exact resource shapes can be confirmed. No writes.
 *   Abort       If the live trigger RegEx contains a token NOT in the taxonomy,
 *               the script aborts (non-zero) instead of dropping it — reconcile
 *               the taxonomy first, then re-run.
 *   Orphans     Live DLV keys / tag param rows / regex tokens the taxonomy no
 *               longer contains are PRINTED (read-only) and never auto-deleted.
 *
 * AUTH — Google blocks gcloud's built-in OAuth client from requesting these
 * sensitive scopes for ADC. Use a user-owned OAuth client (one-time):
 *   1. GCP Console → enable "Tag Manager API" (+ "Google Analytics Admin API").
 *   2. OAuth consent screen → add yourself as a Test user.
 *   3. Credentials → create an OAuth client ID, type "Desktop app", download JSON.
 *   4. gcloud auth application-default login \
 *        --client-id-file=<that>.json \
 *        --scopes=https://www.googleapis.com/auth/tagmanager.edit.containers,\
 *                 https://www.googleapis.com/auth/tagmanager.edit.containerversions
 *
 * ENV (required unless noted) — live values for the KCVV `GTM-P36Q8LHM`
 * container (account owned by kevin.van.ransbeeck@gmail.com — auth as that user):
 *   GTM_ACCOUNT_ID=4702633562
 *   GTM_CONTAINER_ID=247406304
 *   GTM_WORKSPACE_ID=10       (Default Workspace; or a fresh workspace's id)
 *   GTM_TRIGGER_NAME  (default "Custom Event — KCVV Analytics")
 *   GTM_TAG_NAME      (default "GA4 Event — KCVV Custom Events")
 *   GTM_DLV_PREFIX    (default "DLV - ")  — name convention for created DLVs
 *
 * Usage:
 *   node scripts/sync-gtm.mjs --dump
 *   node scripts/sync-gtm.mjs --dry-run
 *   node scripts/sync-gtm.mjs            # writes to the workspace + creates a version
 */

import { execSync } from "child_process";
import { params, buildTriggerRegex } from "./analytics-taxonomy.mjs";

const DRY_RUN = process.argv.includes("--dry-run");
const DUMP = process.argv.includes("--dump");

const ACCOUNT_ID = reqEnv("GTM_ACCOUNT_ID");
const CONTAINER_ID = reqEnv("GTM_CONTAINER_ID");
const WORKSPACE_ID = reqEnv("GTM_WORKSPACE_ID");
const TRIGGER_NAME = process.env.GTM_TRIGGER_NAME ?? "Custom Event — KCVV Analytics";
const TAG_NAME = process.env.GTM_TAG_NAME ?? "GA4 Event — KCVV Custom Events";
const DLV_PREFIX = process.env.GTM_DLV_PREFIX ?? "DLV - ";

const API = "https://tagmanager.googleapis.com/tagmanager/v2";
const WS = `${API}/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}`;

const TOKEN = getToken();

function reqEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Error: ${name} is required (see the usage header for all env vars).`);
    process.exit(1);
  }
  return v;
}

function getToken() {
  try {
    return execSync("gcloud auth application-default print-access-token", {
      stdio: ["pipe", "pipe", "pipe"],
    })
      .toString()
      .trim();
  } catch {
    console.error("Could not get a gcloud ADC token. See the AUTH section in this file's header.");
    process.exit(1);
  }
}

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(`${method} ${url} → ${res.status}: ${json?.error?.message ?? text}`);
  }
  return json;
}

/** Find the entity named `name` in a `GET list` response keyed by `key`. */
function findByName(list, key, name) {
  return (list[key] ?? []).find((e) => e.name === name);
}

/** The taxonomy's full set of dataLayer keys (== GA4 param names). */
const TAXONOMY_KEYS = new Set(params.map((p) => p.parameterName));

/** DLV resource for a dataLayer key. The key lives in the `name` parameter. */
function dlvResource(key) {
  return {
    name: `${DLV_PREFIX}${key}`,
    type: "v",
    parameter: [
      { type: "integer", key: "dataLayerVersion", value: "2" },
      { type: "boolean", key: "setDefaultValue", value: "false" },
      { type: "template", key: "name", value: key },
    ],
  };
}

/** The dataLayer key a DLV variable reads (its `name` parameter value). */
function dlvKey(variable) {
  return variable.parameter?.find((p) => p.key === "name")?.value;
}

/** The arg1 (regex) value of a customEvent trigger's matchRegex filter. */
function triggerRegexParam(trigger) {
  const filter = (trigger.customEventFilter ?? []).find((f) => f.type === "matchRegex");
  return filter?.parameter?.find((p) => p.key === "arg1");
}

/** The GA4 Event tag's custom-param list ("eventSettingsTable" or "eventParameters"). */
function tagParamList(tag) {
  return (tag.parameter ?? []).find(
    (p) => p.type === "list" && (p.key === "eventSettingsTable" || p.key === "eventParameters"),
  );
}

/** Param names already present as rows in the GA4 tag's custom-param list. */
function tagParamNames(tag) {
  const list = tagParamList(tag)?.list ?? [];
  return list
    .map((row) => row.map?.find((m) => m.key === "parameter")?.value)
    .filter(Boolean);
}

function tagParamRow(name) {
  return {
    type: "map",
    map: [
      { type: "template", key: "parameter", value: name },
      { type: "template", key: "parameterValue", value: `{{${DLV_PREFIX}${name}}}` },
    ],
  };
}

async function main() {
  // ── Load live entities ────────────────────────────────────────────────
  const [variablesList, triggersList, tagsList] = await Promise.all([
    api("GET", `${WS}/variables`),
    api("GET", `${WS}/triggers`),
    api("GET", `${WS}/tags`),
  ]);

  const trigger = findByName(triggersList, "trigger", TRIGGER_NAME);
  const tag = findByName(tagsList, "tag", TAG_NAME);
  if (!trigger) throw new Error(`Trigger "${TRIGGER_NAME}" not found (set GTM_TRIGGER_NAME).`);
  if (!tag) throw new Error(`Tag "${TAG_NAME}" not found (set GTM_TAG_NAME).`);

  if (DUMP) {
    console.log(JSON.stringify({ trigger, tag, variables: variablesList.variable ?? [] }, null, 2));
    return;
  }

  const liveDlvByKey = new Map();
  for (const v of variablesList.variable ?? []) {
    if (v.type === "v") {
      const key = dlvKey(v);
      if (key) liveDlvByKey.set(key, v);
    }
  }

  // ── 1. Trigger regex (abort if live has an unknown token) ─────────────
  const canonical = buildTriggerRegex();
  const canonicalTokens = canonical.split("|");
  const liveRegex = triggerRegexParam(trigger)?.value ?? "";
  // Tolerate an anchored/grouped live regex (`^(a|b|c)$`) when token-checking.
  const liveTokens = liveRegex
    .replace(/^\^?\(?/, "")
    .replace(/\)?\$?$/, "")
    .split("|")
    .filter(Boolean);
  const unknownTokens = liveTokens.filter((t) => !canonicalTokens.includes(t));
  if (unknownTokens.length > 0) {
    console.error(
      `ABORT: the live trigger RegEx contains token(s) absent from the taxonomy:\n` +
        `  ${unknownTokens.join(", ")}\n` +
        `Add them to scripts/analytics-taxonomy.mjs (or remove them from the trigger), then re-run.`,
    );
    process.exit(2);
  }
  const regexNeedsUpdate = liveRegex !== canonical;

  // ── 2. DLVs to create (deduped by dataLayer key) ──────────────────────
  const dlvsToCreate = params.map((p) => p.parameterName).filter((k) => !liveDlvByKey.has(k));

  // ── 3. GA4 tag param rows to add (deduped by name) ────────────────────
  const liveTagParams = new Set(tagParamNames(tag));
  const tagRowsToAdd = params.map((p) => p.parameterName).filter((k) => !liveTagParams.has(k));

  // ── Orphan report (read-only) ─────────────────────────────────────────
  const orphanDlvs = [...liveDlvByKey.keys()].filter((k) => !TAXONOMY_KEYS.has(k));
  const orphanTagParams = [...liveTagParams].filter((k) => !TAXONOMY_KEYS.has(k));

  // ── Plan ──────────────────────────────────────────────────────────────
  console.log("── Plan ───────────────────────────────────────────");
  console.log(`Trigger regex: ${regexNeedsUpdate ? "UPDATE" : "up-to-date"}`);
  if (regexNeedsUpdate) {
    console.log(`  live:      ${liveRegex || "(empty)"}`);
    console.log(`  canonical: ${canonical}`);
  }
  console.log(`DLVs to create (${dlvsToCreate.length}): ${dlvsToCreate.join(", ") || "—"}`);
  console.log(`GA4 tag param rows to add (${tagRowsToAdd.length}): ${tagRowsToAdd.join(", ") || "—"}`);
  console.log("── Orphan report (read-only; nothing deleted) ─────");
  console.log(`  DLV keys not in taxonomy (${orphanDlvs.length}): ${orphanDlvs.join(", ") || "—"}`);
  console.log(`  tag param rows not in taxonomy (${orphanTagParams.length}): ${orphanTagParams.join(", ") || "—"}`);

  if (DRY_RUN) {
    console.log("\n--dry-run: no changes written.");
    return;
  }

  // ── Apply ───────────────────────────────────────────────────────────────
  if (regexNeedsUpdate) {
    const updated = structuredClone(trigger);
    const param = triggerRegexParam(updated);
    if (param) {
      param.value = canonical;
    } else {
      // Live trigger has no matchRegex filter yet — construct one.
      updated.customEventFilter = [
        {
          type: "matchRegex",
          parameter: [
            { type: "template", key: "arg0", value: "{{_event}}" },
            { type: "template", key: "arg1", value: canonical },
          ],
        },
      ];
    }
    await api("PUT", `${API}/${trigger.path}`, updated);
    console.log(`✓ trigger regex updated`);
  }

  for (const key of dlvsToCreate) {
    await api("POST", `${WS}/variables`, dlvResource(key));
    console.log(`✓ DLV created: ${DLV_PREFIX}${key}`);
  }

  if (tagRowsToAdd.length > 0) {
    const updated = structuredClone(tag);
    let list = tagParamList(updated);
    if (!list) {
      list = { type: "list", key: "eventSettingsTable", list: [] };
      updated.parameter = [...(updated.parameter ?? []), list];
    }
    list.list = [...(list.list ?? []), ...tagRowsToAdd.map(tagParamRow)];
    await api("PUT", `${API}/${tag.path}`, updated);
    console.log(`✓ GA4 tag param rows added: ${tagRowsToAdd.length}`);
  }

  // ── Unpublished version for owner review ────────────────────────────────
  const version = await api("POST", `${WS}:create_version`, {
    name: "KCVV analytics taxonomy sync",
    notes: "Automated by scripts/sync-gtm.mjs (#1974). Review the diff and publish.",
  });
  const id = version?.containerVersion?.containerVersionId ?? "(see GTM UI)";
  console.log(`\n✓ Created UNPUBLISHED container version ${id}. Review + publish it in the GTM UI.`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

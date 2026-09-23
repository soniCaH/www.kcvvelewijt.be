# Test Suite Spec — the handoff from map #3078

One-shot handoff. Run this in a **fresh session** to pick up the closed `/wayfinder` map
[Test suite walk — findings map](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3078)
with nothing lost, and hand it to `/mattpocock-skills:to-spec`.

Delete this file once `docs/prd`-equivalent work is done — the spec issue and its tickets replace it.

## What this is

The map is **complete**: 22 tickets closed, none open. Every ruling on it was **measured**, not
reasoned. It is an index — one paragraph per decision, each linking the ticket that holds the detail.

Your job in this session is to load it, obey the constraints below, and then stop so the user can
type the next command. **You cannot invoke `/mattpocock-skills:to-spec` or `to-tickets` yourself** —
both carry `disable-model-invocation: true`. Only the user can start them.

## Step 1 — Check the precondition

```bash
gh pr view 3130 --json state,mergedAt --jq '[.state,.mergedAt]|@tsv'
```

**If it is not merged, stop here and say so.** Until it lands, every evidence link on the map is a
blob URL on a `research/*` branch the skill itself calls *throwaway*, and one branch deletion
destroys the evidence under 22 decisions. Do not start the spec before it merges.

Also confirm nobody deleted the branches early:

```bash
git ls-remote --heads origin 'research/*' | wc -l
```

## Step 2 — Read, in this order

1. **The map**, top to bottom — Destination, Notes, all 21 Decisions so far, the **Handoff**
   section, then the retained patches under *Not yet specified*:

   ```bash
   gh issue view 3078 --json body --jq .body
   ```

2. **`docs/research/README.md`** → its *Test-suite corpus — 2026-09* section.

3. **An individual ticket only when the spec needs a detail its gist on the map does not carry.**
   Do not pre-read all 22.

## Step 3 — Carry these rulings; do not re-derive them

Every one of these was measured. A session that re-reasons one reaches a different answer with none
of the evidence. Quote the ruling and cite its ticket by name and link.

| # | Ruling |
| --- | --- |
| D1 | **One spec, not one per layer.** The cross-layer rules plus one section per layer. `/to-tickets` wires blocking edges only *within what it is given*, and the hardest edges here are cross-layer — the gate is blocked by VR **and** E2E determinism. Five specs cannot express them. |
| D2 | **Flake class I (the Cloudflare deploy transient) is out of scope** — a deploy step, not a test layer. 0 failures in 100 runs. The spec carries one sentence: *the required check is `quality-checks` only; deploy jobs never gate.* |
| D3 | **The ten research docs land on `main` first** — PR #3130, the precondition above. |
| D4 | **The gate is one sequenced step, not three.** One issue owns branch protection (`main` has none today, and no rulesets). Order: `quality-checks` → VR → E2E. Each later layer is *add one more required check*, never *set up protection again*. |
| D5 | **Flake class M closes with a written budget:** *a test may not use more than half its own timeout.* Checked on demand from `slowTestThreshold` output already in every CI log. **A breach opens an issue, never a red check.** No lint rule — 9 of 10 `expect()`-in-a-loop files are harmless. |
| D6 | **The first unblocked slice is the gate itself:** turn on branch protection with `quality-checks` as the only required check, and prove a docs-only PR still merges. |
| D7 | **The ten filed issues split 7 / 2 / 1.** In: #3056, #3104, #3118, #3119, #3120, #3127, #3128 — **reference them as existing tickets, never re-file them.** Out, as product bugs: #3077, #3115. Closed with its root cause named: #3099. |
| D8 | **The map is the handoff.** No second document. It stays open and unarchived until the spec is merged, because the spec links back to it. |

## Step 4 — Hard constraints on the spec itself

1. **The spec issue must NOT carry the `ready` label.** `/to-spec` applies `ready-for-agent`, and
   `docs/agents/triage-labels.md` maps that to this repo's **`ready`** — the single gate the AFK
   queue reads. A spec carrying it becomes one agent brief for the entire decision set. Only the
   tickets `/mattpocock-skills:to-tickets` produces may be `ready`.
2. **The spec's "seams" section is already decided.** They are the layer contract
   ([#3086](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3086)). Restate it; do not invent
   new seams.
3. **One item is a wide refactor, not a vertical slice:** the nine-call-site
   `pnpm --filter @kcvv/web check-all` → `pnpm turbo run lint type-check test build --filter=…`
   change ruled by [#3123](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3123). `/to-tickets`
   sequences those expand–contract. Flag it so the breakdown does not force it vertical.
4. **Carry-overs that own no section of their own:** pass 2 of the agent-skill sweep
   ([#3113](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3113)), and the two residual
   **measurements** — not decisions — deferred by
   [#3123](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3123): the warm-cache
   `turbo run … --summarize` saving, and `--concurrency`, left at Turbo's default on
   [#3090](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3090)'s finding that waves break on
   shared state, not load.
5. **The three patches under *Not yet specified* on the map are spec input, not fog.** They hold the
   class-by-class walk, the Storybook `play` re-homing detail and the docs-drift list.

## Step 5 — Stop

Report what you loaded, then tell the user to type:

```text
/mattpocock-skills:to-spec
```

and, once the spec issue exists and they have read it:

```text
/mattpocock-skills:to-tickets <spec issue number>
```

Do not run either yourself. Do not start implementing.

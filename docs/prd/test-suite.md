# PRD: Test Suite

**Status**: Ready for implementation
**Date**: 2026-09-23
**Spec issue**: [#3131](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3131)
**Map**: [#3078](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3078) — 22 tickets, all closed
**Milestone**: `test-suite-contract`

> **The spec issue is the canonical handoff; this file mirrors it.** #3131 is what
> `/mattpocock-skills:to-tickets` read to produce the 26 tickets below, and it is where any
> amendment is recorded first. This file exists so the rulings are greppable from the repository
> and survive issue churn. If the two ever disagree, the issue wins.
>
> **Every ruling here was measured, not reasoned.** A session that re-derives one will reach a
> different answer with none of the evidence. Quote the ruling and cite its ticket. The evidence is
> the ten documents in `docs/research/`, landed by #3130 — one of them, the flake ledger, is alive
> and edited as classes open and close; the other nine are frozen, dated evidence.

## Tickets

Published 2026-09-23 by `/mattpocock-skills:to-tickets`. **26 tickets, #3133 – #3158.** Blocking edges are set as GitHub's native `blockedBy` relationship — what `scripts/unblocked-issues.sh`, `/ralph` and `/ralph-afk` read — and restated in prose on each ticket. 21 native edges.

| Ticket                                                                       | Spec section       | Blocked by                 |
| ---------------------------------------------------------------------------- | ------------------ | -------------------------- |
| #3133 — branch protection, `quality-checks` only (**tracer bullet**)         | §1.1–§1.5          | —                          |
| #3134 — the red alert names the failing tests                                | §0.10, §12         | —                          |
| #3135 — the build reads no slug page, a static page bails on demand          | §0.3               | —                          |
| #3136 — a sub-threshold VR drift rewrites its baseline                       | §4.2               | —                          |
| #3137 — a VR page fetches nothing off this machine                           | §4.10              | #3136                      |
| #3138 — split the Storybook build, shard VR 3×                               | §4.6, §10.3        | —                          |
| #3139 — VR becomes the second required check                                 | §4.12, §1.1        | #3133, #3136, #3137, #3138 |
| #3140 — one command surface for VR                                           | §4.8               | —                          |
| #3141 — the wave guards its shared resources                                 | §7.3, §7.4         | —                          |
| #3142 — three static rules close three classes                               | §2.2, §2.3, §2.4   | #3127                      |
| #3143 — a test may not use half its own timeout                              | §3.5, §3.6         | #3128                      |
| #3144 — every schema round-trips on both sides                               | §5.1, §5.2         | —                          |
| #3145 — cache semantics in real workerd                                      | §5.1, §5.2         | #3144                      |
| #3146 — `play` takes the geometry, the two specs go                          | §0.4, §4.13        | —                          |
| #3147 — six pinned fixture documents in staging                              | §6.4, §6.6         | —                          |
| #3148 — pinned subjects, against staging                                     | §6.3, §6.4, §6.5   | #3147                      |
| #3149 — the surviving skip guards become failures                            | §6.7               | #3148                      |
| #3150 — re-measure the flake rate — not near zero, retries stay at 1 (#3196) | §0.9               | #3146, #3149               |
| #3151 — E2E on PRs only, third required check                                | §6.8, §1.1         | #3133, #3150               |
| #3152 — changed-line coverage PR comment                                     | §8.2, §8.3, §8.4   | —                          |
| #3153 — migrations with logic move to the shared package                     | §8.8               | #3120                      |
| #3154 — all eight workspaces state their layers                              | §0.6, §4.11, §11.3 | #3056                      |
| #3155 — _expand_: the filtered turbo call works everywhere                   | §9.1–§9.3          | #3118, #3119               |
| #3156 — _migrate_: the nine call sites move                                  | §9.2               | #3155                      |
| #3157 — _contract_: delete the composite script                              | §9.2               | #3156                      |
| #3158 — pass 2 of the agent sweep + two measurements                         | §9.4, §9.5         | #3157                      |

**#3155 → #3156 → #3157 is the wide refactor**, sequenced expand–contract rather than forced into vertical slices (§9.3).

**Adopted, not re-filed** — the seven existing tickets of D7. Six gate a ticket above: #3056 → #3154, #3118 + #3119 → #3155, #3120 → #3153, #3127 → #3142, #3128 → #3143. Only #3104 (the missing `engines` field) gates nothing.

**`ready-for-human`, not `ready`** — repository settings, an app install, or the owner's other profile: #3133, #3139, #3151, #3152, #3158.

**No ticket exists for**, by ruling: the remote cache (accepted, do not sign — §10.4, §10.5), a diff-driven visual selection (keep the full run — §10.6), flake class I (out of scope — §1.5), and the documentation drift (#3102 already closed).

---

## Problem Statement

A red check in this repo does not mean anything in particular.

It can mean a real regression. It can equally mean a timing race, a live Sanity read during `next build`, CPU contention between wave agents, a font CDN that did not answer, a stale Docker image, or a test that needs 83 % of its own timeout on an idle machine. Because a red check is ambiguous, three habits have grown around it:

- **The suite is not trusted.** All three `main is red` incidents ever filed were flakes. Each was closed by hand, days later, with no root cause recorded, because the alert says only _"a workflow went red"_.
- **The suite is not required.** `main` has no branch protection and no rulesets. "PRs must be green before merging" is a habit, not a rule. Visual regression gates nothing. E2E gates nothing at all. The whole suite has exactly **one** gate: `deploy` waits on `quality-checks`.
- **The suite hides its own condition.** 7 of the last 12 green `main` E2E runs hid a retry. 6 of those 7 were one test that also failed its retry.

Underneath that sit measured defects the owner pays for in waiting time: a 17.2-minute critical path per visual PR of which 31 % is VR waiting on a 37-second artifact; a wave of 4 agents in which 2 lanes go red on shared TCP ports; an E2E suite that picks its own subjects off the live sitemap every run; and a visual-regression layer that fetches its fonts from two third-party CDNs behind the one wait in the runner that is not capped.

## Solution

Give every layer a written contract, then make the gate mean something.

**One rule governs all of it: a red check means a real regression, and a check that cannot promise that does not gate.** A layer _earns_ the gate by becoming deterministic. Report-only is a waiting room, not a destination.

Concretely, after this spec ships:

- `main` has branch protection, with a **loose** required check, added one layer at a time as each layer earns it: `quality-checks` first, then visual regression, then E2E.
- Every known flake class has a named root cause and a **rule** that makes it unrepeatable — a lint rule, a config rule, or an enforcement route. Where no rule is possible, that is written down as an accepted risk.
- The visual-regression layer fetches nothing off the machine it runs on.
- The E2E layer runs against pinned fixture documents in `staging`, on pull requests only, with no data-shaped `test.skip` guards left.
- A wave of 4 agents guards its named shared resources and never guards CPU.
- The budget is wall-clock only, read from recorded CI history, and a breach opens an issue — never a red check.

## User Stories

1. As a developer, I want a red check to mean the code is wrong, so that I stop re-running jobs to find out whether a failure was real.
2. As a developer, I want a green check to mean the suite actually ran, so that a skipped or retried test cannot hide behind it.
3. As a developer, I want the pull-request critical path under 10 minutes, so that I am not blocked waiting on a pipeline that spends a third of its time on an artifact nobody is reading.
4. As a developer, I want pre-commit under 30 seconds, so that committing stays cheap enough that I do not reach for `--no-verify`.
5. As a developer, I want each layer to say what it owns, so that I know where to put a new test without guessing.
6. As a developer, I want each layer to say what it must **not** own, so that a layout assertion never lands in a DOM emulator that lies about layout.
7. As a developer, I want a duplicate assertion treated as a defect, so that pushing a check down to a cheaper layer means deleting the expensive copy rather than keeping both.
8. As a developer, I want geometry assertions to live in a real browser against a fixture, so that they stop flaking against live data in Playwright.
9. As a developer, I want the visual-regression runner to fetch nothing off this machine, so that a third-party font CDN cannot stall a story for 90 seconds and report zero tests.
10. As a developer, I want a sub-threshold visual drift to rewrite its baseline, so that the committed PNGs stop silently going stale.
11. As a reviewer, I want a visual-regression failure to mean the pull request is incomplete, so that a missing baseline update is caught in review rather than after merge.
12. As a developer, I want all three viewports kept for every visual story, so that weight and speed are solved by sharding rather than by cutting coverage.
13. As a developer, I want one command surface for visual regression, so that no agent or human can reach past the guard with a raw runner flag.
14. As a developer, I want the full local visual run to stay refused, so that nobody burns two and a half hours on emulated capture by accident.
15. As a developer, I want a scoped local capture in under 5 minutes, so that updating a baseline does not need a round trip through CI.
16. As a developer, I want E2E to run against pinned fixture documents, so that the suite tests the same subjects every run.
17. As a developer, I want E2E to run against `staging`, so that a content type missing from production stops silently skipping tests.
18. As a developer, I want the surviving data-shaped skip guards turned into failures, so that the suite audits its own fixtures instead of quietly passing.
19. As a developer, I want a fixture event dated far in the future, so that the E2E clock cannot expire on a date nobody is watching.
20. As a developer, I want E2E on pull requests only, so that ~3 900 runner-minutes a month stop being spent on a run that gates nothing.
21. As a developer, I want `next build` to degrade rather than die when a content read fails, so that a content outage cannot paint `main` red.
22. As a developer, I want a contract layer at the BFF seam, so that a wire-format change breaks a fast test instead of a page.
23. As a developer, I want the Worker's cache semantics tested in real workerd, so that KV, TTL and single-flight behaviour is verified where it actually runs.
24. As a developer, I want pure Worker logic to stay on the fast node runner, so that the workerd pool is paid for only where it is needed.
25. As a developer, I want every workspace to state which layers apply to it, so that a package with no tests is a decision rather than an oversight.
26. As a maintainer, I want coverage never to gate, so that a coverage drop is read as less testing rather than as a regression.
27. As a reviewer, I want changed-line coverage as a pull-request comment, so that I can see what the change left untested without a percentage threshold blocking merge.
28. As a maintainer, I want the flake **class** to be the unit of work, so that the tracker does not fill with one ticket per occurrence.
29. As a maintainer, I want a flake class to close with a rule or not at all, so that "it stopped flaking" is never an acceptance criterion.
30. As a maintainer, I want a flaking test root-caused and fixed or deleted, so that nothing is parked in a quarantine nobody revisits.
31. As a maintainer, I want the red-alert issue to name the failing tests, so that an incident cannot close without a root cause again.
32. As a maintainer, I want the alert to stay dumb and a human to classify, so that a rename cannot silently break an automatic mapping.
33. As a developer, I want a dependency-caused flake to get a local workaround plus an upstream issue, so that the fix is not blocked on someone else's release.
34. As a wave operator, I want the wave to guard named shared resources, so that two worktrees cannot claim the same TCP port or the same container.
35. As a wave operator, I want the wave to stay at 4 agents at the default worker count, so that a measured 2.4× throughput win is not traded away for a tuning guess.
36. As a wave operator, I want the visual-regression image built once per wave, so that parallel image builds cannot freeze the daemon for 16 minutes.
37. As a wave operator, I want the visual-regression container held under an exclusive lock, so that an agent that skims the brief still cannot break the run.
38. As a wave operator, I want a lane's development server bound to its own port, so that a lane cannot silently test another lane's build.
39. As a developer, I want a test that uses more than half its own timeout to be reported, so that a slow test body is found before a slow runner turns it red.
40. As a developer, I want that budget checked on demand from output CI already produces, so that compliance costs no extra run.
41. As a maintainer, I want the budget measured in wall-clock only, so that a $0 invoice is not mistaken for a free pipeline.
42. As a maintainer, I want compliance read from recorded CI history, so that verifying a budget never means re-running the suite.
43. As an AFK agent, I want one way to invoke the quality gate, so that my run reads and writes the cache and builds its upstream packages like everyone else's.
44. As an AFK agent, I want the gate's command to be valid in every workspace, so that a brief cannot hand me a command that is wrong for the package I am in.
45. As a maintainer, I want branch protection turned on with one required check first, so that the gate is proved end to end before more checks are added to it.
46. As a maintainer, I want a documentation-only pull request to stay mergeable, so that turning on a required check does not deadlock the repository.
47. As a maintainer, I want each later layer to be one more required check, so that the gate is never set up twice.
48. As a maintainer, I want the agent-facing documentation to match the contract, so that an agent does not learn a bypass from the brief that is meant to prevent one.
49. As a maintainer, I want the stale testing claims in the workflows and the visual-regression product document corrected, so that a reader is not told that a layer is paused when it runs on 61 of the last 100 runs.
50. As a maintainer, I want the accessibility addon's real behaviour recorded, so that a layer that produces 288 violations per run and gates nothing is either owned by a layer or switched off on purpose.
51. As a maintainer, I want the finished one-shot scripts deleted and the rest gathered into one workspace member, so that ~4 500 lines that write to production content stop running under no lint, no type-check and no tests.
52. As a maintainer, I want the three tests that exercise those scripts to move with them, so that a cached-green hole closes without a cache-configuration edit.
53. As a maintainer, I want a migration that holds logic to live in the shared studio package with a test, so that the two studio migration folders cannot drift again.
54. As a maintainer, I want shell scripts linted, so that a real shell defect becomes a red check while the cost of adopting it is still zero findings.
55. As a maintainer, I want the full visual run kept rather than a diff-driven selection, so that the suite never silently under-shoots on a change the module graph cannot see.
56. As a maintainer, I want the findings map to stay open until this spec is merged, so that the evidence chain behind every ruling stays reachable.

## Implementation Decisions

### Section 0 — Cross-layer rules

**0.1 The one rule** — [the layer contract (#3086)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3086). _A red check means a real regression. A check that cannot promise that does not gate._ A layer **earns** the gate by becoming deterministic. Report-only is a waiting room, not a destination.

**0.2 The seams are the layers.** Six, no new ones. Static; Build; Vitest/happy-dom; Storybook in a real browser; a **new** contract layer at the BFF seam; Playwright E2E. Each row below states what it owns, what it must not own, and what red means. This table is [#3086](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3086)'s and is restated, not redesigned.

| Layer                                                             | Owns                                                                                                                                                                                                                            | Must not own                                                                                                             | Red means                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Static** — tsgo, ESLint, Sanity TypeGen, `api-contract` schemas | The shape of every wire and query result; every convention a rule can enforce                                                                                                                                                   | Behaviour                                                                                                                | The code is wrong. **Gates.**                                                                                                    |
| **Build** — `next build`                                          | That the app compiles and prerenders                                                                                                                                                                                            | Dying on a live service (amended clause, §0.3)                                                                           | The code is wrong. **Gates.**                                                                                                    |
| **Vitest / happy-dom**                                            | Pure logic, transforms, adapters, metadata and canonical URLs, Effect services via mock layers, sync orchestration, GROQ against fixtures, component behaviour with only the network mocked                                     | Layout, breakpoints, geometry, `matchMedia`, `hashchange`, `color-mix()`; **async RSC pages** (10 files touch one today) | The code is wrong. **Gates.**                                                                                                    |
| **Storybook in a real browser**                                   | Pixel truth at 3 viewports, **and** runtime geometry against a fixture via `play` — overflow arrows, sticky offsets, scroll-spy                                                                                                 | Real-data composition                                                                                                    | **The pull request is incomplete** — either the pixels broke or the new baseline is missing. Does not gate yet; earns it via §4. |
| **Contract at the BFF seam** — _new_                              | Encode → JSON → decode round-trip of every `api-contract` schema on **both** sides; the Worker's runtime semantics (KV, TTL, single-flight) in **real workerd**                                                                 | Consumer-driven contract testing — one consumer, one provider, one repo                                                  | The wire is wrong. **Gates.**                                                                                                    |
| **Playwright E2E**                                                | Route smoke against a production server — status including the streaming and 404 contract, headings, chrome, no broken image, no console error — plus hydration and cross-route navigation, against a **deterministic** backend | **Geometry, ever.** Live content services                                                                                | The app is broken. Does not gate until §6 lands.                                                                                 |

**0.3 The Build clause, as amended** — [#3086](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3086) amended by [the E2E data contract (#3087)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3087) §7, with the owner's explicit consent. It reads _a build may not **die** on a live service_, not _may not read one_. _Corrected by #3135:_ the original "four of nine sites degrade, five do not" was a grep count of the guard, not a measurement of the failure path — the five just `return []` and read nothing. Both recorded deaths were the **page render** of an enumerated slug (`/staf/259`, `/evenementen/ploegvoorstelling-kampioenenviering`). So **every** static-params site returns `[]`, and at build `runPromise` turns a transient Sanity failure (transport, 5xx, 429) into Next's on-demand bailout — an invalid query still fails the build: a page with no slug is left out of the build (rendered on demand until the next deploy); at runtime nothing changes. Only a content-read failure takes that exit; a code defect still fails the build. No route disables dynamic params, so an empty list lets every ungenerated slug render on demand. The interception seam measured by [the testmode spike (#3098)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3098) is **withdrawn, not deleted** — it stays the known working mechanism if this clause ever reverts. Cost accepted in writing: a partial content response now prerenders fewer pages instead of failing loudly.

**0.4 Clause — push it down, then delete the copy.** A duplicate assertion is a **defect**, not insurance. First application: once `play` covers them, the two geometry specs are **deleted**, not thinned. They hold 26 of the 29 E2E geometry assertions and 12 of the 31 data guards; the route smoke suite already covers the same route.

**0.5 Clause — a flake class closes with a rule, or it does not close.** Every class that ever died here died to a rule, never to a raised timeout. Three rule shapes are in use: a **lint rule**, a **config rule**, and an **enforcement route** (a mechanism that makes the whole class impossible). Where no rule is possible, the accepted risk is written down.

**0.6 Clause — every workspace answers.** All **eight** workspaces state which layers apply (`apps/studio-staging` was missed by #3086's count of six, and the `scripts` package added by §8 makes eight). _"None, and here is why"_ is a valid written answer; silence is not. The answers live as a **column on the workspace table already in the repository's agent instructions**, not in a new document.

**0.7 Clause — flake rate per layer is this contract's metric.** It is the number that proves _red = regression_. Coverage adequacy is a different question, answered in §8.

**0.8 The flake class is the unit of work** — [the flake policy (#3089)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3089). One ticket per class, never per occurrence; a new occurrence comments on its class. A class ticket **may not carry `ready` until its closing rule is named**, because otherwise its acceptance is _"it stopped flaking"_, which no agent can verify in one session. A flaking test is root-caused and fixed, or deleted — **never parked**; no quarantine mechanism is built. A dependency-caused class gets a local workaround **always**, plus an upstream issue **when a minimal reproduction exists, filed by the owner, never by an agent** — the first case is the DOM emulator's media-query listener seeding its match state to `false`, for which a six-line reproduction exists and no upstream issue does.

**0.9 Retries** — [#3089](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3089). One retry stays and a flaky pass stays green; a flaky pass is not a regression, so it must not paint the check red. **Committed tripwire:** 100 % of measured E2E flake (64 of 64 instances, from 4 locations) lives inside the two specs §0.4 deletes, so once they are gone the rate is re-measured and **retries go to 0** if it is near zero.

**Tripwire fired negative, 2026-09-26 ([#3150](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3150)):** re-measured from recorded CI history (never re-run) once §0.4's two specs were gone. Only 6 `E2E` runs had executed since the deletion merged; 1 of them (16.7 %) was already flaky, in a spec added after this section's original count and never a deletion candidate. Not near zero — **retries stay at 1.** The surviving class is tracked in [#3196](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3196), retries revisit once it closes. Detail: `docs/research/test-suite-flake-ledger.md` classes B and N.

**0.10 The red-alert workflow must record _what_ failed** — failing test names, flaky count, a link to the ledger. This is why all three prior incidents closed with no root cause. The signal already exists in the reporter tally; it just never reaches the issue. **The alert stays dumb and a human classifies**, so the ledger stays plain Markdown rather than an identifier-and-pattern format whose mappings break silently on every rename.

**0.11 Flake rate is measured on demand into the ledger**, by the sweep method that produced it, with no scheduled job.

**0.12 The budget is wall-clock only** — [the budgets (#3091)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3091). The $0 was verified against the account's own billing API, not quoted from documentation: this repository ran 10 032 Actions minutes for $0.00 net across 44 rows, while three private repositories on the same account start showing real charges the week the shared allowance ran out. **The exemption covers standard runners only.** Numbers: **pre-commit ≤ 30 s** (the full monorepo type-check stays — it was never the expensive part); **pull-request critical path ≤ 10 min**, measured on the path, not the job; **full visual run ≤ 5 min on CI**; **scoped local capture ≤ 5 min**; **the local full-run refusal is permanent** — a guard, not a budget, so no speed-up reopens it.

**0.13 The agent quality gate gets no clock number**, only the rule: _lint + type-check + test + build; a fifth step is a decision, not a drift._ A relative ceiling was dropped as over-complicated and the evidence agrees — the same Vitest suite measured 130 s, 295 s and 337 s on the same machine, a 2.6× spread.

**0.14 A budget breach opens an issue, never a red check** — §0.1 applied directly: a slow runner is not a regression. Same tripwire machinery as §0.8, deliberately not a second one.

**0.15 Compliance is read from recorded CI history, never produced by re-running the suite.** The timing and billing endpoints are free, instant and 100 runs deep.

### Section 1 — The gate

**1.1 One sequenced step, not three** — [the handoff shape (#3126)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3126) D4. Confirmed twice that `main` has **neither branch protection nor rulesets**. **One issue owns branch protection.** Each later layer is _add one more required check_, never _set up protection again_. Order: **`quality-checks` → visual regression → E2E.**

**1.2 The first unblocked slice is the gate itself** — D6. Turn on branch protection with `quality-checks` as the **only** required check, and prove a documentation-only pull request still merges. It is the thinnest slice that proves §0.1.

**1.3 The required check is _loose_.** Strict — _require branches to be up to date_ — is **ruled out** by the owner on wave cost: a batch of agent branches would each need CI, rebase, CI again. A **merge queue** was costed and then terminated on availability: it requires an organization-owned repository and this one is personal. A loose required check costs zero per merge and makes "pull requests must be green" mechanical rather than a habit.

**1.4 Precondition, load-bearing:** the workflow-level path filter must become a **job-level condition** first, or every documentation-only pull request becomes permanently unmergeable. A documentation-only pull request currently runs **nothing**.

**1.5 The required check is `quality-checks` only. Deploy jobs never gate.** [#3126](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3126) D2 measured 0 deploy failures in the last 100 CI runs.

### Section 2 — Static layer

**2.1 Three of seven workspaces are linted by nothing.** Adopted as existing tickets, not re-filed: [#3118](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3118) (the staging studio's lint is never invoked) and [#3119](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3119) (`api-contract` and `sanity-schemas` have no lint script at all).

**2.2 Shell linting is adopted** — [the coverage contract (#3100)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3100), on a measurement rather than an argument. 8 of 9 shell files are clean at every severity and the single finding is a false positive on a hook that has no shebang by design. It improves nothing today; zero findings is the cheapest moment to adopt, and unquoted-expansion and masked-return-value findings are real bugs, so a future red **is** a regression under §0.1.

**2.3 The lint rule that closes the DOM-emulator class** — [#3083](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3083), adopted by [#3089](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3089). A restricted-syntax selector on assignment to `innerWidth` / `innerHeight`, in the same mould as the existing in-body-import rule. **Specification warning:** an esquery selector containing a newline fails _silently_ — the selector must be written on one line.

**2.4 A test may not bind a fixed TCP port** — [the wave contract (#3090)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3090). A restricted-syntax rule on listening calls. One member today; the rule keeps it at one.

### Section 3 — Vitest layer

**3.1 Keep Vitest and keep happy-dom** — [#3083](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3083), evidenced, not inertia. The cost Vitest is blamed for — ~60 % of CPU in module import against ~9 % in assertions — is a module-graph cost every alternative also pays. jsdom is a strict regression. Browser mode has **zero** component-test files to run once §0.4 re-homes the geometry files.

**3.2 Two of the four measured "happy-dom gaps" do not reproduce.** Width evaluation and hash-change events both work; the fault is Vitest's own global shim, which installs window keys through a setter that lands the write in a map rather than in the emulated window. **So the class is ours** and closes with §2.3's lint rule. Underneath sits a genuine six-line upstream bug in the media-query listener — §0.8's dependency shape applies.

**3.3 Isolation stays.** It is load-bearing: the green suite at 98.6 s becomes 21.6 s with **178 failures** without isolation, and 14.3 s with **267** on a thread pool.

**3.4 Worker-count tuning is _not_ adopted.** [#3083](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3083) proposed capping wave agents at 2 workers; [#3090](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3090) measured four real concurrent lanes and **overrode it** — see §7.

**3.5 Remaining Vitest work:** an `engines` field, and one file moved onto fake timers. The cache-input fix has already shipped.

**3.6 Class M — a test body with no headroom** — [#3126](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3126) D5, opened by [the shared-state sweep (#3124)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3124). The written budget: **a test may not use more than half its own timeout.** The default timeout is Vitest's 5 000 ms and the offending test burns **83 %** of it solo. Checked **on demand** from slow-test output already present in every CI log; **a breach opens an issue, never a red check**. **No lint rule** — the pattern is statically visible but the cost comes from the iteration count, which no selector can see: 9 of the 10 files with assertions inside a loop iterate a handful of fixture items and cost nothing. The fix for the one live member is to collect violations and assert once, not to raise the timeout — adopted as [#3128](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3128).

### Section 4 — Storybook / visual regression layer

**4.1 Keep the layer, keep the runner, keep the amd64 pin** — [the VR contract (#3088)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3088), accepting [#3082](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3082)'s verdict in full, with **no further spike**. The runner is not deprecated; a release shipped this month. Migration alternatives are closed in §10.

**4.2 Sub-threshold drift must rewrite the baseline.** The image-snapshot library gates baseline updates on an option that defaults to `false` and is never set here, so a drift under the threshold leaves the old PNG in place. Turn it on. **Verified, not promised** — the owner's standing condition after the visual bot's first setup — with a named end-to-end acceptance test, and it **ships alone on its own pull request**.

**4.3 Thresholds stay unchanged.** The pixel threshold runs 20× stricter than a typical default with all antialiasing noise absorbed by the ratio gate. Odd, but causing no live flake. Recorded as a **tripwire**; no calibration run is commissioned.

**4.4 All three viewports stay** for every visual story. Weight and speed are solved by sharding and ergonomics, never by cutting coverage.

**4.5 Baseline weight is accepted and written down.** ~808 MB of PNG objects, ~76 % of the object store, sunk under every option. Large-file storage is rejected; a blob-filtered clone is documented instead.

**4.6 Shard the CI visual run 3×**, and split the Storybook build into its own job. **No platform guard in the ignore file** — the amd64 pin is the structural guard.

**4.7 Capture stays local-first.** Inverting to CI-capture-only is **rejected** on a number research did not weigh: a scoped local capture is 179 s cold and byte-identical to CI, against a ~10-minute round trip. The wave freeze it was meant to solve is an image-build collision, closed by §7.

**4.8 One command surface.** Only the workspace's own visual scripts — never the raw runner, the raw container command, or a raw update flag. The drift is already live in the agent brief and is fixed by §9.

**4.9 Two small in-place changes are taken** for the line deletion, on the owner's override, and one is skipped. The stability loop is **skipped** — no live flake, and it would double captures to 6 088. The clock-freezing change inherits §4.2's verify-don't-promise bar: fix the time rather than installing fake timers wholesale, and the animation-frame waits must still resolve.

**4.10 Class G — a visual page may not fetch anything off this machine** — [the story stall (#3108)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3108), the last live visual flake class, root-caused by a two-arm experiment in the pinned container that **falsified the ticket's own lead**. The cause is not memory: the preview head loads two live third-party font sources, and the accessibility addon's cross-origin stylesheet preloader re-fetches each one per story, turning one page-load fetch into one round trip per story — 8 third-party requests per story. Black-holed, a single story reports `Timeout 90000ms exceeded, Tests: 0 total`, because a stylesheet link blocks the load event and the vendored page-ready helper waits on it uncapped. The rule is an **enforcement route**: a deny-by-default request route in the runner's preparation step, replacing the hand-maintained seven-host video deny-list (a net deletion); the monospace face self-hosted under its open licence; the licensed face prefetched once per run into the static directory, because its terms forbid self-hosting; and the vendored helper replaced by this repository's own capped equivalent. **Acceptance is verified, not promised: zero off-machine requests _and_ a clean working tree under the snapshot directory** — if a baseline moves, the substitution is wrong and it does not ship.

**4.11 Accessibility ownership is decided in the per-workspace table (§0.6), not by a documentation line.** Measured: the accessibility addon **does** run, on every story inside the visual job, producing 264 violation blocks and 288 violations per run, identical across sampled green runs, and **gating nothing**.

**4.12 The layer earns its required check in this order:** §4.2 → §4.10 → §1.4 → turn it on (loose; strict is impossible behind a path filter).

**4.13 Geometry comes in, via `play` against a fixture.** 16 of 208 story files have a `play` today. The Vitest Storybook addon is installed and registered but **dark** — no test plugin, no browser block, no projects. Wiring it is for `play` only; note that wiring it smoke-tests **every** story, which is 208 browser tests, not 11.

### Section 5 — Contract layer at the BFF seam (new)

**5.1 A new layer, at the highest seam available** — [#3086](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3086) Q7. Round-trip every `api-contract` schema on **both** sides, and exercise the Worker's runtime semantics — cache reads and writes, expiry, single-flight — in **real workerd** through the Cloudflare Vitest pool. The pool is **not installed**; the installed Vitest version meets its requirement.

**5.2 Split rule:** a path that touches the cache, expiry or single-flight runs in workerd; **pure logic stays on the node runner.** Consumer-driven contract testing is explicitly out — one consumer, one provider, one repository.

### Section 6 — Playwright E2E layer

**6.1 Keep the browser layer and keep Playwright** — [#3081](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3081), a finding rather than inertia: no ledger row is caused by a Playwright defect, the visual runner already depends on it, and Next.js ships a first-party, Playwright-only server-fetch proxy.

**6.2 There is no third dataset, at any price below Enterprise** — [#3087](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3087), measured: the plan's dataset quota is 2, overage is disallowed, and the paid tier below Enterprise is also 2. A second free project was costed and **rejected on project size**. This killed the research ticket's own first step.

**6.3 E2E always runs against `staging`** — a one-line workflow change. Measured: staging carries _more_ of every article type than production, which holds **zero** event articles — the cause of the skip-count gap between the two.

**6.4 Pinned subjects replace sitemap discovery.** The fixture helper is 172 lines that probe up to 30 article pages **every run** and take whatever is newest. **Six fixture documents in staging**, one per kind, written by an **idempotent** script — fixed identifiers, create-or-replace, and it **refuses any dataset but `staging`**.

**6.5 Matches stay discovered.** The sitemap filters them to a rolling 90-day window, so no match identifier can be pinned.

**6.6 The clock has a measured expiry and is closed permanently.** Staging's last future event is 2027-01-09; one fixture event dated 2099 closes it.

**6.7 The ~19 surviving skip guards become failures**, flipped in the same pull request, because the suite is the audit.

**6.8 E2E runs on pull requests only and earns the required check.** The `main` trigger is dropped: ~3 900 runner-minutes a month, and 63 % of its green runs hid a retry.

**6.9 Data determinism does not fix everything, and the spec says so.** 6 of the 7 hidden retries are hydration and intersection-observer races that no data option touches; there is no hydration signal to wait for, and the framework prescribes an app-side fix.

**6.10 Ceiling to state:** under the test proxy there are **no cache hits at all** — the flag disables the incremental cache in both directions, so every render is cold and an E2E run stops exercising incremental regeneration. **Two traps for whoever wires it:** the proxy's config helper is not importable from an ESM config file, and it silently overrides the test-match and projects settings.

### Section 7 — The local wave environment

**7.1 The wave is profitable and CPU is not the problem** — [#3090](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3090), from the first ever measurement of four real concurrent chains: 714 s for four lanes against 1 688 s serial, a **2.4× throughput win** for a 1.67× per-lane slowdown, with every Vitest phase scaling a uniform ≈1.9×. **The wave stays at 4 agents at the default worker count.**

**7.2 The memory hypothesis is falsified.** Swap was identical in both arms and never moved; free memory bottomed at the same point in both; the build step was the **least** affected — the opposite of the prediction.

**7.3 The general rule: a wave guards named shared resources, never CPU.** The register holds **five** members — [#3124](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3124) corrected the contract from three:

1. **TCP ports** — a port computed from a counter that restarts at zero in every process, so every worktree claims the same ports in the same order. Fix: an ephemeral port. Closing rule: §2.4. Adopted as [#3127](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3127). Proved by a two-arm experiment, not inferred: same ports → 3 failures, different ports → 8 of 8 green.
2. **The visual image build** — the wave's step 0 builds the image **once**, and the container wrapper's rebuild flag is **removed**, replaced by a fail-fast when the image is absent. The pre-build alone does not close it, because the next call rebuilds anyway.
3. **The visual container** — an exclusive lock, implemented as a directory-creation mutex, _because an agent can skim a brief and cannot skim a lock_. Four containers would want all of the machine's memory.
4. **The compose project name**, derived from the working-directory basename so every worktree shares one project — already closed by the lock in member 3.
5. **The development server's port under the browser runner's server-reuse setting** — the **only open member**: a second lane does not fail, it **reuses the first lane's server and tests the wrong build**. Dormant only because the agent brief runs the quality gate and never E2E.

**7.4 One visual-baseline issue per wave stays** as a separate rule about merge conflicts. It would not have prevented the freeze.

**7.5 A genuine starvation failure stays a test defect.** The wave contract does not bend around a timing test — §0.4 and §3.6 apply.

### Section 8 — Coverage and the workspace map

**8.1 Coverage never gates, permanently** — [the coverage contract (#3100)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3100). §0.1 applied directly: a coverage drop is less testing, not a regression. Unlike the visual and E2E layers, this one **cannot earn the gate later**.

**8.2 "Enough" is measured three ways:** flake rate per layer (§0.7); the **eight** written per-workspace layer answers (§0.6); and a **changed-line coverage pull-request comment**.

**8.3 The coverage upload is a write-only pipe.** It has succeeded every run for nine months, and the service has **never** posted a comment or a status here. The fix is the app install plus a configuration file that turns **statuses off and the comment on**.

**8.4 The coverage include-list is unset**, so today's headline percentages count imported files only, and an unimported changed file would report as _untracked_ rather than 0 %. Set it; the headline drops, which costs nothing under §8.1.

**8.5 Mutation testing is dropped.** Not installed, no live problem, and the sources behind the original proposal argue for changed-line-in-review rather than a second tool.

**8.6 ~4 344 lines of finished one-shot scripts are deleted** — every owning issue is closed — and the rest becomes **one workspace member, not four**; that is the only shape that reaches the loose files at the directory root. The whole directory had no lint, no type-check and no test run while holding ~4 569 lines that write to production content.

**8.7 A live cached-green hole closes with no cache-configuration edit.** Three web tests spawn or import the real script files, but the cache inputs do not hash that directory. **Moving those three tests into the new workspace fixes the cause.** Adopted as [#3056](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3056).

**8.8 Migrations close with a rule instead of a deletion.** 15 of 26 re-export tested modules from the shared studio package; 11 hold logic in place across 435 untested lines. Deleting all 26 would delete 15 passing tests to save nothing. **Rule: a migration with logic lives in the shared studio package with a test; the studio's own migrations folder may only re-export.** The measured drift between the two studios' migration folders — all six drifted files are in-place-logic ones — is adopted as [#3120](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3120).

**8.9 A gap list decays. Re-measure before building on one.** Three of the coverage ticket's own named gaps were already stale when it opened.

### Section 9 — The agent-facing layer

**9.1 The agent layer's only quality gate is not a task in the build system** — [the agent-skill sweep (#3113)](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3113): 35 commands swept, 7 wrong, 12 bypassing, 1 stale. **11 of the 12 bypassing rows are one command**, in 9 files, which reads and writes no cache, skips the task graph, never builds upstream packages, and never runs the studio's type generation before the build.

**9.2 Shape A, the task-runner route** — [#3123](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3123). The nine call sites become a single task-runner invocation of lint, type-check, test and build filtered to one workspace. **The composite script is _not_ promoted to a task.** This closes all 11 bypassing rows at once, deletes a now-redundant manual package build from the agent brief, and fixes a 5-of-7-wrong command template, because the filtered form is valid in every workspace.

**9.3 This one is a _wide refactor_, not a vertical slice.** Nine call sites in documentation and skills. It is sequenced expand–contract, not broken into a vertical slice per call site.

**9.4 Two residuals are measurements, not decisions**, and belong to the implementation ticket: the warm-cache wall-clock saving, read from one summarised run; and the concurrency setting, **left at the task runner's default** on §7.1's finding that waves break on shared state, not load.

**9.5 Pass 2 of the sweep is a named step**, not a second sweep. Its pass-1 findings that are not yet closed: the global agent instructions file is wrong in full _and_ outranks this repository's own; every Worker CLI line in one skill fails on the default Node version; and the agent brief teaches both a bypassing raw flag and two wrong claims about the visual check command.

### Section 10 — CI

**10.1 Keep Actions, keep the one-job shape, keep the hardcoded workspace filters** — [#3084](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3084). The "25-minute serial job" is a **timeout, not a duration**: median 6.6 min over 100 runs, with one step at 64 % of it and the entire cross-workspace matrix at **6 seconds combined**. The only number worth optimising is the **17.2-minute critical path**, 31 % of which is the visual job waiting on a 37-second artifact.

**10.2 Affected-only is rejected** with numbers: 70 % of pull requests touch the web app, which owns 64 % of the job; the 8 % touching only the API are already covered by the cache; the task runner's own documentation prefers caching to filtering.

**10.3 Ordered changes, after the one already shipped:** split the Storybook build into its own job and shard the visual run 3× → path-filter the `main` visual arm and move coverage to `main`-only → make the quality job a **loose required check, last**. Cost: **+2.6 runner-minutes per visual pull request for −11.5 minutes of critical path**, ~5 600 runner-minutes a month returned. The unconditional push-to-`main` visual arm went **23-for-23 green** — 21 % of spend, zero catches.

**10.4 Remote-cache behaviour is accepted, not fixed** — [#3125](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3125), measured rather than inferred. The build cache hit **is the deploy platform's own build replayed** into the same team cache, finishing minutes before CI reaches its build step; and the environment split feeds the build task's declared variables, putting preview and production in **two cache namespaces**, which is why the asymmetry inverts on `main`. Winning that race would mean CI waiting on the deploy platform — minutes of blocked pipeline for ~50 s of post-merge compute, which §0.12 rules against.

**10.5 Do not sign the remote cache** (owner ruling, accepted in writing). No fork-triggered pull requests in the last 60; the cache provider **is** the deploy platform; CI's deploy job ships the API and studio only, so a poisoned artifact reaches a check and never the site; and a key living in two systems fails **silently** to a 0 % hit rate.

**10.6 Keep the full visual run; no diff-driven selection** — [#3110](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3110). A real module graph under-shot **0 of 63** merged pull requests, but **only** because a hand-maintained escape-hatch list caught the two it got wrong: the preview entry point is a **disconnected vertex** in the graph, so the global stylesheet reaches **zero** stories and one pull request selected **0 of 700**. The guarantee would live in a list nothing verifies. Selection averages 35.7 % of a full run ≈ ~5 min saved, against sharding's ~5.7 min with **no correctness argument**.

### Section 11 — Documentation

**11.1 The stale testing claims are corrected** — [#3102](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3102), three of them load-bearing: the CI workflow still says the visual layer is _paused during the redesign_ (61 of the last 100 runs executed it); the visual-regression product document claims native Apple-Silicon capture _eliminates this category of flakiness_ (falsified — which is why the container is pinned to amd64); and it claims the visual layer _gates merge to main_ (it gates nothing).

**11.2 The evidence corpus is documentation, and it is already on `main`** — ten documents in the research directory. **One is alive** — the flake ledger, the register of the unit of work, edited as classes open and close. **Nine are frozen** dated evidence: cite them, do not revise them. Two amendments from [#3125](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3125) ride with the CI document.

**11.3 The repository's agent instructions are a required deliverable of this work**, not optional cleanup — the workspace layer table of §0.6 lives there.

### Section 12 — The ten filed issues

**Adopted — referenced as existing tickets, never re-filed** (7): [#3056](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3056), [#3104](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3104), [#3118](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3118), [#3119](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3119), [#3120](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3120), [#3127](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3127), [#3128](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3128).

**Out, as product bugs** (2): [#3115](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3115) and [#3077](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3077) — reframed into the client-only render defect on the help page. The map's _deleted and re-homed_ line describes the **test**, not the live product bug.

**Closed with its root cause named** (1): [#3099](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3099) — so it is not the fourth `main is red` incident to close with none.

## Testing Decisions

**What makes a good test here.** A test asserts external behaviour at one of the six seams in §0.2 and nothing below it. It does not reach into implementation, and it does not repeat an assertion a cheaper layer already makes — a duplicate assertion is a **defect** (§0.4). A test that cannot promise _red = regression_ does not gate (§0.1). A test that needs more than half its own timeout is reported and fixed (§3.6). A test that binds a fixed port, writes outside its worktree, or fetches off the machine is closed by a rule, not by a retry (§0.5).

**Which modules are tested, and where.** The §0.2 table is the answer, and **all eight workspaces state their own row** (§0.6) — _"none, and here is why"_ is valid, silence is not.

**Prior art in this repository, to copy rather than invent:**

- **Closing a class with a lint rule** — the in-body route-import rule is the model, and the same restricted-syntax machinery carries §2.3 and §2.4.
- **An empty static-params list** — five of nine sites already returned `[]`; §0.3 (#3135) makes it all nine.
- **Fixture-backed rendering instead of a live fetch** — the image fixtures state this rationale verbatim, and §4.10 applies the same reasoning to fonts.
- **A capped page-ready wait** — this repository already has one; §4.10 replaces the vendored uncapped helper with it.
- **Baseline review in the pull request** — the visual diff-comment job already makes a baseline change visible, which is what lets §0.2's _"the pull request is incomplete"_ hold.
- **Effect service testing through mock layers** and **GROQ against fixtures** — both already the house pattern for the Vitest layer.

**Acceptance is verified, not promised.** The owner's standing bar after the visual bot's first setup. Two named end-to-end acceptance tests carry it: a sub-threshold visual drift **must rewrite the PNG** (§4.2), and the font substitution must produce **zero off-machine requests _and_ a clean working tree under the snapshot directory** (§4.10). If a baseline moves, the substitution is wrong and it does not ship.

**Verification that costs nothing.** Budget and flake-rate compliance is read from recorded CI history — the timing and billing endpoints and the slow-test output already in every log — and **never** by re-running the suite (§0.15, §3.6).

## Out of Scope

- **Flake class I — the deploy transient.** A deploy step, not a test layer: 0 failures in 100 runs against one occurrence ever, and it never gates. The spec carries one sentence, §1.5.
- **Production monitoring — a scheduled live-site probe.** Real gap, wrong tool: an uptime monitor is not a test layer and lives outside CI. The standing no-recurring-bill constraint applies here too.
- **Hosted visual-regression services.** Ruled out on the **no-recurring-bill constraint**, not on price — so **no quote is to be sought**, and a cheaper one would not reopen it. Independently a poor fit at ~2.3 M screenshots a month.
- **Migrating visual regression off the current runner.** All four alternatives closed: the Vitest addon has no visual-testing feature, the experimental screenshot matcher has a worse update model, rebuilding story discovery on the browser runner is 3–4 weeks, and the remaining tool is archived.
- **Requiring branches to be up to date, and merge queues.** §1.3 — one on wave cost, one on availability.
- **Signing the remote cache.** §10.5, accepted in writing; reopens only if a writer outside CI and the deploy platform gains access.
- **A diff-driven visual selection.** §10.6.
- **Mutation testing.** §8.5.
- **A quarantine mechanism.** §0.8 — a subscription to administer a problem a deletion closes.
- **A scheduled flake-rate job.** §0.11 — measured on demand.
- **Product bugs the suite exposes.** Filed and fixed as normal issues; this spec decides how the suite catches them.

## Further Notes

- **The findings map stays open and unarchived until this spec is merged.** It is the index this spec links back to, and it is deliberately the **only** handoff document — a second copy of these rulings would drift from the other three.
- **Two loose ends that own no section** and must not be dropped in the breakdown: pass 2 of the agent-skill sweep (§9.5), and §9.4's two residual measurements.
- **The wide refactor of §9.2** is the one item that must **not** be forced into a vertical slice.
- **Every evidence link in this spec resolves to `main`.** The research branches may now be deleted; their content landed in [#3130](https://github.com/soniCaH/www.kcvvelewijt.be/pull/3130).
- **Two corrections the map records against its own earlier work**, kept here so nobody re-derives the wrong number: the count of async-RSC-rendering test files is **10, not 6**, and wiring the Storybook Vitest addon costs **208 browser tests, not 11**.
- **A note on reading this spec:** where a ruling looks odd — the 20× strict pixel threshold, the permanently refused local visual run, the unchanged retry count — it was measured and the oddity is recorded as a tripwire on purpose. Re-deriving it without the evidence will produce a different answer.

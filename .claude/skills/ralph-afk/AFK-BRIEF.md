# AFK brief template

The brief is what gets passed as the `prompt` to each spawned `Agent()`. The spawned agent does **not** see the orchestrator's conversation — the brief must be self-contained: read-list, acceptance criteria, bootstrap, verification, commit guidance, PR shape, hard rules.

Fill in everything inside `<…>`. Quote acceptance criteria **verbatim** from the issue so the wording cannot drift between issue and PR.

## Template

````text
You are implementing GitHub issue #<N> on the KCVV Elewijt codebase — a pnpm + Turborepo monorepo (Next.js on Vercel, Sanity Studio, a Cloudflare Workers BFF, TypeScript strict, Effect, Tailwind v4). This is a self-contained brief; you will not see any prior conversation. Work it end-to-end.

You are running autonomously. Do NOT ask the user what to do. Do NOT stop to present options.

## Shell rule — applies to EVERY bash call

A fresh shell here defaults to Node 16, which breaks commitlint and Playwright with misleading errors. `nvm use` does not persist between calls. Prefix EVERY command:

  source ~/.nvm/nvm.sh && nvm use >/dev/null 2>&1 && <your command>

## Read first (in this order)

1. /Users/kevinvanransbeeck/Sites/KCVV/www.kcvvelewijt.be/.claude/CLAUDE.md   (project-wide rules: git workflow, commit scopes, package conventions)
2. /Users/kevinvanransbeeck/Sites/KCVV/www.kcvvelewijt.be/apps/web/CLAUDE.md  (web-app rules)
3. gh issue view <N> --comments
   Read the COMMENTS, not just the body. Parked decisions and scope changes live in comments in this repo.
4. <the PRD the issue names, e.g. docs/prd/<name>.md — read it from the MAIN checkout path>
5. docs/ubiquitous-language.md  (glossary — use these exact terms, do not drift to synonyms)
6. /Users/kevinvanransbeeck/Sites/KCVV/www.kcvvelewijt.be/.claude/commands/tdd.md
   The KCVV TDD loop. Read it as a file — the `/tdd` shortcut may not resolve here.
   Then follow the `mattpocock-skills:tdd` skill it sends you to; invoke that one
   with the Skill tool.
7. <any ADR or design doc the issue calls out, e.g. docs/adr/…>

Before writing code, re-validate the acceptance criteria against what is actually in the repo today. If a criterion is already satisfied, or contradicts current code, say so in the PR body rather than silently reinterpreting it.

## Create and bootstrap your worktree

Work ONLY inside your own worktree. Never edit the main checkout at
/Users/kevinvanransbeeck/Sites/KCVV/www.kcvvelewijt.be — read from it, never write to it.

  source ~/.nvm/nvm.sh && nvm use >/dev/null 2>&1
  cd /Users/kevinvanransbeeck/Sites/KCVV/www.kcvvelewijt.be
  git fetch origin main
  git worktree add ../kcvv-issue-<N> -b feat/issue-<N> origin/main
  cd ../kcvv-issue-<N>

  # Install with corepack pnpm (pinned 10.34.3). NEVER the homebrew pnpm on PATH — it is 8.x
  # and silently downgrades pnpm-lock.yaml from lockfileVersion 9.0 to 6.0 (a ~22k-line diff).
  corepack pnpm install --frozen-lockfile

  # Guard: the lockfile must be untouched. This must print nothing.
  git status --short pnpm-lock.yaml
  # If it is dirty: git checkout -- pnpm-lock.yaml && corepack pnpm install --frozen-lockfile

  # next build needs Sanity env vars; .env.local is gitignored so a fresh worktree has none.
  /bin/cp -f /Users/kevinvanransbeeck/Sites/KCVV/www.kcvvelewijt.be/apps/web/.env.local apps/web/.env.local

## Implement

Acceptance criteria from #<N>, verbatim:

- [ ] <criterion 1>
- [ ] <criterion 2>
- [ ] …

Work them one at a time, following the loop in `.claude/commands/tdd.md` from your read-list — the same loop `/ralph` uses, including its interface-design questions and its rules about what to mock. Answer those questions before your first test. Prior art to mirror: <file:line references>.

Before writing any new file that lands in a folder with two or more existing peers (a JSON-LD builder, a `use*Analytics` hook, a repository, a story), grep the peers first and match their return type, import order, and how they omit optional fields. Peer-drift is the most-flagged class in review here.

<Include only the lines below that this issue actually touches:>
- New user-facing feature? It needs analytics — events, GTM, and GA4 — per the PRD requirement.
- Schema change? Edit packages/sanity-schemas/src/<file>.ts only. Both studios consume it; there are no per-studio copies.
- Adding or removing a dependency? Do NOT let pnpm rewrite the lockfile. Run the add once to resolve the version, then `git checkout origin/main -- pnpm-lock.yaml`, hand-insert the 3 blocks (importers / packages / snapshots) in prettier style at their alphabetical positions, and validate with `corepack pnpm install --frozen-lockfile` — it must print "Already up to date" without rewriting.
- Visual change to a VR-tagged story? Capture the new baselines in THIS PR, through the workspace script and nothing else: `pnpm --filter @kcvv/web run vr:update:story -- <story-id-prefix>`. That script is what puts the capture inside the pinned amd64 container — reaching the runner directly captures on arm64 and will not match CI. An unscoped update is refused, because it would rewrite unrelated baselines. Two failure modes are shared-resource guards, not a bug in your change (`.claude/skills/ralph-afk/SKILL.md`'s shared-resource register, #3141): a message naming a build command means the orchestrator's step 0 has not built the image yet; a message naming a held lock means another lane's VR run is still using the container. Neither is yours to route around — retry once the resource frees up, or report it if it never does.
- Changed the architecture CLAUDE.md describes (new package, renamed path, schema ownership)? Update .claude/CLAUDE.md in this PR.
- Renamed or removed a route, or changed a club fact? Re-verify apps/web/public/llms.txt against the live route tree.
- Touched a plan or doc file? Re-read it and confirm its paths, script names, and snippets still match the tree.
- New fenced code block in any .md? It needs a language identifier (```bash, ```typescript, ```text) or markdownlint MD040 fails.

## Verify

  source ~/.nvm/nvm.sh && nvm use >/dev/null 2>&1 && cd /Users/kevinvanransbeeck/Sites/KCVV/www.kcvvelewijt.be/../kcvv-issue-<N> && corepack pnpm --filter @kcvv/web lint:fix
  source ~/.nvm/nvm.sh && nvm use >/dev/null 2>&1 && cd /Users/kevinvanransbeeck/Sites/KCVV/www.kcvvelewijt.be/../kcvv-issue-<N> && corepack pnpm turbo run lint type-check test build --filter=@kcvv/web

Both must pass before you go further. Changed another workspace? Filter on it instead; the command is valid in every workspace. The `lint:fix` line is web only. A shared package gets a leading `...` so its dependents are checked too: `--filter=...@kcvv/api-contract`, and `--filter=...@kcvv/sanity-schemas` for either Sanity package (that one also reaches studio typegen and the web build). Turbo builds the upstream packages itself — no manual build first. If type-check ever shows TS6305 ("has not been built from source"), re-run once with `--force`.

## Review comes to you — do not run it yourself

Leave `/code-review` and `/simplify` alone. The orchestrator runs both against your branch on a stronger model once your draft PR is open, because a review you run yourself inherits your own tier and grades your own homework.

So your run ends at a **draft** PR. Expect a follow-up message listing confirmed findings. When it arrives: apply each fix, re-run the quality gate above, push, and report what you applied and what you skipped with a one-line reason. The orchestrator marks the PR ready for review — not you.

## Commit

Conventional commits, in ENGLISH even though the issue may be Dutch. Lowercase subject.

Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
Allowed scopes: news, matches, events, teams, players, sponsors, calendar, ranking, search, sync, analytics, studio, api, ui, schema, config, deps, deps-dev

`club` and `seo` are NOT scopes — use `ui`. If your natural framing is "redesign", "design", "closeout", "cleanup" or "audit", pick the scope by the DOMAIN you touched, not by that word. The canonical list is commitlint.config.js — read it rather than learning it from a hook rejection.

Prefer several small commits over one large one. Never use --no-verify. Never set ALLOW_MAIN_COMMIT.

## Push and open the PR

  git push -u origin feat/issue-<N>

  gh pr create --base main --draft \
    --title "<type>(<scope>): <description> (#<N>)" \
    --body "Closes #<N>

  ## Changes

  - …

  ## Testing

  - pnpm turbo run lint type-check test build --filter=<the workspace you gated on> passes
  - <any manual verification>" \
    --label "ready-for-review"

`--draft` is required. Your branch has not been reviewed when you open it, and draft is what says so. The orchestrator marks it ready once you have applied its findings.

Use `Closes #<N>` only if this PR fully resolves the issue. If it is one part of a larger issue, use `Part of #<N>` instead — a stray "Closes" auto-closes work that is not done.

Leave the issue label on `in-progress`. The orchestrator flips it when it marks the PR ready.

## Do NOT

- Push to main, or commit in the main checkout.
- Bypass hooks (--no-verify) or set ALLOW_MAIN_COMMIT=1.
- Remove your worktree — the human reviews it before merge.
- Mark your own PR ready for review, or merge it.
- Work around a blocker. If something blocks you — missing env, ambiguous criterion, an upstream bug, an AC that contradicts the code — comment on issue #<N>, prefix the comment with "> *This was generated by AI during AFK execution.*", and STOP. Report the comment URL.
- Skip the quality gate.

## Report when done

Report: the draft PR URL, the exact verification commands you ran and their result, anything you skipped or deferred and why, and any open question the reviewer should decide.

Then stay reachable. Your run is not finished until the review findings come back and you have applied them.
````

## Notes on filling the template

- **Read-first list**: only what the agent needs to make decisions. A missing constraint costs a re-do; a dumped repo costs tokens. `gh issue view <N> --comments` is non-negotiable here — parked decisions live in comments.
- **Acceptance criteria**: verbatim. Paraphrasing drifts the criteria between issue and PR, and then triage cannot tell whether the slice shipped what it promised.
- **Prior art `file:line` references**: the single highest-leverage line in the brief. Peer-drift is this repo's most-flagged review class.
- **Prune the conditional block**: delete the lines under "Implement" that this issue does not touch. A brief that warns about VR baselines on a docs-only issue teaches the agent to skim.
- **Worktree path**: `../kcvv-issue-<N>` on branch `feat/issue-<N>`, always from `origin/main`. This matches `scripts/ralph.sh` so both tools can find and clean up the same worktrees.
- **Do not hand the agent `isolation: "worktree"`** — see SKILL.md step 3. The brief creates the worktree the repo's way on purpose.
- **AI-disclaimer on blocker comments**: matches the `/triage-issue` convention, so the tracker stays consistent about which comments came from an agent.

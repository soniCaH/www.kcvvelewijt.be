# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

**Layout: single-context.** One `GLOSSARY.md` + `docs/adr/` at the repo root. It's a monorepo, but the domain is a single football club — no per-context split, so there is no `GLOSSARY-MAP.md`.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root — this repo's canonical domain glossary. Read it before naming domain concepts.
- **`docs/domain-reference.md`** — the code names, Dutch labels, rules and history behind each glossary term. Read the entry when you touch the code that holds the term.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. `/domain-modeling` (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

```text
/
├── GLOSSARY.md                  ← canonical glossary
├── docs/
│   ├── domain-reference.md      ← code names, rules, history per term
│   └── adr/                     ← none yet; created with the first ADR
├── apps/       (web · studio · api)
└── packages/   (api-contract · sanity-schemas · sanity-studio)
```

## Use the glossary's vocabulary

When your output names a domain concept (an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

**Adding a term:** the definition goes in `GLOSSARY.md`, in its `**Term**:` + `_Avoid_:` format and with no implementation detail. Code names, value lists, rules and history go in a matching `###` section of `docs/domain-reference.md`.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (...) — but worth reopening because…_

# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

**Layout: single-context.** One glossary + `docs/adr/` at the repo root. It's a monorepo, but the domain is a single football club — no per-context split.

## Before exploring, read these

- **`docs/ubiquitous-language.md`** — this repo's canonical domain glossary (the `CONTEXT.md` equivalent). Read it before naming domain concepts.
- **`CONTEXT.md`** at the repo root, if it exists — a `/domain-modeling` scratch glossary may appear here alongside the canonical one above.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. `/domain-modeling` (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

```text
/
├── docs/
│   ├── ubiquitous-language.md   ← canonical glossary
│   └── adr/
│       ├── 0001-....md
│       └── 0002-....md
├── apps/       (web · studio · api)
└── packages/   (api-contract · sanity-schemas · sanity-studio)
```

## Use the glossary's vocabulary

When your output names a domain concept (an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `docs/ubiquitous-language.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (...) — but worth reopening because…_

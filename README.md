# KCVV Elewijt — www.kcvvelewijt.be

Club website for KCVV Elewijt, a Belgian football club. Built as a Turborepo monorepo with Next.js 16, powered by Sanity CMS and a Cloudflare Workers BFF.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.x-black)](https://nextjs.org/)
[![Effect](https://img.shields.io/badge/Effect-Schema-purple)](https://effect.website/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com/)

---

## Architecture

| App/Package   | Path                     | Host               | Purpose                                |
| ------------- | ------------------------ | ------------------ | -------------------------------------- |
| Next.js web   | `apps/web/`              | Vercel             | Club website                           |
| Sanity Studio | `apps/studio/`           | sanity.io          | CMS admin UI                           |
| BFF API       | `apps/api/`              | Cloudflare Workers | ProSoccerData proxy + cache (Wrangler) |
| API contract  | `packages/api-contract/` | (library)          | Shared Effect schemas + HttpApi        |

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+

### Installation

```bash
git clone https://github.com/soniCaH/www.kcvvelewijt.be.git
cd www.kcvvelewijt.be

pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the web app.

To start Storybook separately:

```bash
pnpm --filter @kcvv/web storybook
```

Open [http://localhost:6006](http://localhost:6006) for Storybook.

### Environment Variables

`apps/web/.env.local`:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_TYPEKIT_ID=your_typekit_id
```

`apps/api/.dev.vars`:

```env
PSD_API_BASE_URL=...
PSD_API_KEY=...
```

---

## Tech Stack

### Core

- **[Next.js 16](https://nextjs.org/)** — React framework with App Router + ISR
- **[TypeScript](https://www.typescriptlang.org/)** — strict mode
- **[React 19](https://react.dev/)** — UI library
- **[Tailwind CSS v4](https://tailwindcss.com/)** — utility-first styling (primary green `#4acf52`)

### Data & Validation

- **[Effect Schema](https://effect.website/docs/schema/introduction)** — runtime type validation for all API data
- **[Sanity](https://www.sanity.io/)** — CMS for articles, teams, players, organigram, sponsors, events
- **[ProSoccerData API](https://prosoccerdata.com/)** — match results and rankings via BFF
- **[Cloudflare Workers](https://workers.cloudflare.com/)** — BFF proxy with caching (Wrangler)

### UI Components

- **[d3-org-chart](https://github.com/bumbeishvili/org-chart)** — organization chart visualization

### Development Tools

- **[Turborepo](https://turbo.build/)** — monorepo build orchestration
- **[Storybook 10](https://storybook.js.org/)** — component development and visual testing
- **[Vitest](https://vitest.dev/)** — unit testing
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** — linting and formatting
- **[Husky](https://typicode.github.io/husky/)** — git hooks (lint-staged, commitlint, type-check)

---

## Project Structure

```text
www.kcvvelewijt.be/
├── apps/
│   ├── web/              # Next.js 16 club website
│   │   ├── src/
│   │   │   ├── app/      # App Router pages
│   │   │   ├── components/   # React components (feature + design system)
│   │   │   └── lib/      # Effect schemas, services, utils
│   │   └── CLAUDE.md     # app-specific dev notes
│   ├── studio/           # Sanity Studio CMS
│   └── api/              # Cloudflare Workers BFF (Wrangler)
├── packages/
│   └── api-contract/     # Shared Effect schemas + HttpApi definitions
├── scripts/              # Maintenance + one-off scripts
├── docs/plans/           # Architecture decision records
├── .claude/              # Claude Code configuration + skills
├── turbo.json            # Turborepo pipeline
├── pnpm-workspace.yaml   # pnpm workspaces
└── package.json          # Root scripts + devDependencies
```

---

## Available Scripts

All commands run from the monorepo root via Turborepo.

### Development

```bash
pnpm dev              # Start all dev servers (web + studio + api)
pnpm build            # Build all apps
pnpm lint             # Lint all packages
pnpm type-check       # TypeScript check all packages
pnpm test             # Run all unit tests
```

### Per-app commands (web)

```bash
pnpm --filter @kcvv/web dev
pnpm --filter @kcvv/web check-all   # lint + type-check + test + build
pnpm --filter @kcvv/web storybook
pnpm --filter @kcvv/web build-storybook
```

### BFF (Cloudflare Worker)

```bash
pnpm --filter @kcvv/api dev         # wrangler dev
pnpm --filter @kcvv/api deploy      # wrangler deploy
```

---

## Features

### Responsibility Finder (`/hulp`)

Interactive help system — visitors describe their role and question to find the right contact person.

**Status:** Active — data managed via Sanity CMS
**Docs:** `RESPONSIBILITY.md`

### Organigram (`/club/organigram`)

Interactive organizational chart of the club structure.

**Status:** Implemented — migration to Sanity in progress (#755)

### Design System

Comprehensive KCVV brand guidelines and component patterns. See `apps/web/CLAUDE.md` for design conventions and tokens.

### Sanity CMS Integration

Content for articles, teams, players, organigram, sponsors, and events.

**Status:** Active — 100% migrated to Sanity

---

## Design System

- **Primary Color:** `#4acf52` (KCVV green)
- **Fonts:** Quasimoda (headings), Montserrat (body) via Adobe Typekit
- **Spacing:** Tailwind v4 scale
- **Breakpoints:** standard Tailwind (`sm`, `md`, `lg`, `xl`, `2xl`)

See Storybook Foundation stories (`pnpm --filter @kcvv/web storybook`) and `apps/web/CLAUDE.md` Design Conventions section for full reference.

---

## Testing

- **Unit tests:** Vitest — target 80%+ coverage. Run: `pnpm test`
- **Component stories:** Storybook 10 with interaction tests. Run: `pnpm --filter @kcvv/web storybook`
- **E2E:** Playwright configured, no specs yet

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feat/feature-name

# Commit with conventional commits
git commit -m "feat(news): add news card component"

# Quality check before push
pnpm --filter @kcvv/web check-all

# Push
git push -u origin feat/feature-name
```

**Commit scopes:** `news`, `matches`, `teams`, `players`, `sponsors`, `calendar`, `ranking`, `api`, `ui`, `schema`, `migration`, `config`, `deps`

Pre-commit hooks run automatically: lint-staged, type-check, commitlint.

---

## Deployment

- **Web (apps/web):** Vercel — auto-deploys from `main`
- **BFF (apps/api):** Cloudflare Workers — `pnpm --filter @kcvv/api deploy`
- **Studio (apps/studio):** sanity.io — `pnpm --filter @kcvv/studio deploy`

---

## Documentation

- `RESPONSIBILITY.md` — Responsibility Finder feature
- `ORGANIGRAM.md` — Organigram feature
- `ACCESSIBILITY_TESTING.md` — Accessibility testing guide
- `SECURITY.md` — security policies
- `apps/web/CLAUDE.md` — design system conventions (colors, spacing, Storybook rules)
- `.claude/CLAUDE.md` — Claude Code project instructions (architecture, git workflow, dev guidelines)
- `docs/plans/` — architecture decision records

---

## Links

- **GitHub Issues:** [soniCaH/www.kcvvelewijt.be/issues](https://github.com/soniCaH/www.kcvvelewijt.be/issues)
- **GitHub Project:** [Platform Overhaul](https://github.com/users/soniCaH/projects/2)
- **Contact:** [kevin@kcvvelewijt.be](mailto:kevin@kcvvelewijt.be)

---

Copyright © 2026 KCVV Elewijt. All rights reserved.

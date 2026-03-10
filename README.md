# KCVV Elewijt - Next.js Website

Modern website for KCVV Elewijt football club, built with Next.js 15+ and powered by Drupal CMS.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black)](https://nextjs.org/)
[![Effect](https://img.shields.io/badge/Effect-Schema-purple)](https://effect.website/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com/)

---

## 🎯 Overview

This is the Next.js-based website for **KCVV Elewijt**, a Belgian football club. The project is migrating from Gatsby to Next.js 15 with modern architecture and best practices.

### Key Features

- ✅ **Drupal CMS Integration** - Content managed via Drupal JSON:API
- ✅ **Effect Schema Validation** - Runtime type safety for all API data
- ✅ **Storybook Component Library** - Visual component development and testing
- ✅ **Responsibility Finder** - Interactive help system (`/hulp`)
- ✅ **Organigram** - Interactive club organization chart
- ✅ **Design System** - Comprehensive KCVV brand guidelines
- ⚠️ **ISR (Incremental Static Regeneration)** - Fast, up-to-date content
- 🚧 **Migration in Progress** - Gatsby → Next.js 15

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, pnpm, yarn, or bun

### Installation

```bash
# Clone repository
git clone https://github.com/soniCaH/kcvv-nextjs.git
cd kcvv-nextjs

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create `.env`:

```env
# Drupal API
NEXT_PUBLIC_DRUPAL_BASE_URL=https://api.kcvvelewijt.be

# Adobe Typekit (for fonts)
NEXT_PUBLIC_TYPEKIT_ID=your_typekit_id
```

---

## 🛠️ Tech Stack

### Core

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Strict type safety
- **[React 19](https://react.dev/)** - UI library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling

### Data & Validation

- **[Effect Schema](https://effect.website/docs/schema/introduction)** - Runtime type validation
- **[Drupal JSON:API](https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module)** - Content API

### UI Components

- **[shadcn/ui](https://ui.shadcn.com/)** - Base component library
- **[Radix UI](https://www.radix-ui.com/)** - Accessible primitives
- **[d3-org-chart](https://github.com/bumbeishvili/org-chart)** - Organization chart visualization

### Development Tools

- **[Storybook](https://storybook.js.org/)** - Component development
- **[Vitest](https://vitest.dev/)** - Unit testing
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Husky](https://typicode.github.io/husky/)** - Git hooks

---

## 📂 Project Structure

```text
kcvv-nextjs/
├── .claude/                      # Claude Code configuration
│   ├── agents/                   # Migration agents (deprecated)
│   ├── skills/                   # Reusable skills (Drupal API, migrations)
│   ├── CLAUDE.local.md          # Project instructions for Claude
│   ├── WORKFLOW.md              # Git workflow
│   └── SETUP_VERIFICATION.md    # Setup verification report
├── .github/                      # GitHub workflows and templates
│   ├── workflows/               # CI/CD pipelines
│   └── ISSUE_TEMPLATE/          # Issue templates
├── .storybook/                   # Storybook configuration
├── public/                       # Static assets
│   └── images/                  # Images and graphics
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (main)/             # Main site pages
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Homepage
│   ├── components/              # React components
│   │   ├── ui/                 # Base UI components (shadcn)
│   │   ├── organigram/         # Organigram feature
│   │   ├── responsibility/     # Responsibility finder
│   │   └── ...                 # Feature-specific components
│   ├── lib/
│   │   ├── effect/             # Effect Schema setup
│   │   │   ├── schemas/        # Drupal entity schemas
│   │   │   └── services/       # API services
│   │   ├── mappers/            # JSON:API data mappers
│   │   └── utils/              # Utility functions
│   ├── data/                    # Static data
│   │   └── club-structure.ts   # Organigram data
│   ├── types/                   # TypeScript types
│   └── styles/                  # Global styles
├── tests/                        # Test files
├── DESIGN_SYSTEM.md             # ⭐ Design system reference
├── SCHEMA_GUIDE.md              # ⭐ Effect Schema guide
├── STORYBOOK.md                 # ⭐ Storybook guide
├── RESPONSIBILITY.md            # Responsibility finder docs
├── ORGANOGRAM.md                # Organigram docs (⚠️ feature has issues)
├── SECURITY.md                  # Security policy
├── MIGRATION_PLAN.md            # Migration progress tracking
└── package.json
```

**⭐ Key Documentation:**

- `DESIGN_SYSTEM.md` - Authoritative design reference
- `SCHEMA_GUIDE.md` - How to create/validate schemas
- `STORYBOOK.md` - Component development guide

---

## 📜 Available Scripts

### Development

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run type-check       # Run TypeScript compiler
npm run format           # Format with Prettier
npm run check-all        # Run all quality checks (lint + type + test + build)
```

### Testing

```bash
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
```

### Storybook

```bash
npm run storybook        # Start Storybook (http://localhost:6006)
npm run build-storybook  # Build static Storybook
npm run test-storybook   # Run Storybook interaction tests
```

### Migration

```bash
npm run migration:status    # Check migration progress
npm run migration:create    # Create migration tracking issue
```

---

## 🎨 Design System

The project follows a comprehensive design system documented in **`DESIGN_SYSTEM.md`**.

### Key Guidelines

- **Primary Color**: `#4acf52` (KCVV green)
- **Fonts**: Quasimoda (headings), Montserrat (body)
- **Spacing**: Tailwind scale with custom additions
- **Breakpoints**: `768px`, `992px`, `1280px`, `1440px`

**Before creating components:** Review `DESIGN_SYSTEM.md` for colors, typography, spacing, and component patterns.

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

- All components have test files (`.test.tsx`)
- Target: 80%+ coverage
- Run: `npm test`

### Storybook Stories

- Component development and documentation
- Interactive testing
- Run: `npm run storybook`

### Integration Tests

- E2E tests (planned)

---

## 📚 Key Features

### 1. Responsibility Finder (`/hulp`)

Interactive help system where visitors find the right contact person.

**Status:** ✅ Active — data managed via Sanity CMS
**Docs:** `RESPONSIBILITY.md`
**Issues:** #429-436

### 2. Organigram (`/club/organigram`)

Interactive organizational chart showing club structure.

**Status:** ⚠️ Implemented but unusable (readability/navigation issues)
**Docs:** `ORGANOGRAM.md`
**Issues:** #437-440 (CRITICAL fixes needed)

### 3. Design System

Comprehensive KCVV brand guidelines and component patterns.

**Status:** ✅ Complete and authoritative
**Docs:** `DESIGN_SYSTEM.md`

### 4. Drupal Integration

Fetches content from Drupal CMS via JSON:API with Effect Schema validation.

**Status:** ✅ Working (articles, teams, players, etc.)
**Docs:** `SCHEMA_GUIDE.md`

### 5. Storybook

Component library and development environment.

**Status:** 🚧 Partial (Responsibility Finder complete, ~55+ components need stories)
**Docs:** `STORYBOOK.md`
**Issues:** #441-444

---

## 🔒 Security

See **`SECURITY.md`** for security policies including:

- Image handling and SVG security
- File upload validation
- Drupal server-side validation requirements
- Defense-in-depth approach

**Reporting vulnerabilities:** [kevin@kcvvelewijt.be](mailto:kevin@kcvvelewijt.be)

---

## 🚧 Migration Status

This project is **migrating from Gatsby to Next.js 15**.

### Progress

- ✅ Phase 0: Design System - COMPLETED
- ✅ Phase 1: Foundation - COMPLETED
- 🚧 Phase 2: Content Pages - IN PROGRESS
- ⏳ Phases 3-9: Upcoming

**Track progress:** `MIGRATION_PLAN.md` (too large for viewing, use `npm run migration:status`)

---

## 🤝 Contributing

### Git Workflow

**Always work on feature branches:**

```bash
# Create feature branch
git checkout -b feat/feature-name
# or
git checkout -b fix/bug-name
# or
git checkout -b migrate/page-name

# Make changes, commit with conventional commits
git add .
git commit -m "feat(news): add news card component"

# Push to remote
git push -u origin feat/feature-name

# Create PR (ask first!)
gh pr create
```

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <description>

[optional body]

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `migrate`
**Scopes:** `news`, `matches`, `teams`, `players`, `sponsors`, `calendar`, `ranking`, `api`, `ui`, `schema`, etc.

### Pre-commit Hooks

Husky runs automatically:

- ESLint check
- TypeScript check
- Prettier formatting
- Conventional commit validation

### Code Quality

Before pushing:

```bash
npm run check-all
```

This runs:

1. ESLint (zero errors, zero warnings)
2. TypeScript type check
3. All unit tests
4. Production build

---

## 🌐 Deployment

### Vercel (Recommended)

The easiest way to deploy:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables

Set in Vercel dashboard:

- `NEXT_PUBLIC_DRUPAL_BASE_URL`
- `NEXT_PUBLIC_TYPEKIT_ID`

### Build Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

---

## 📖 Documentation

### Project Documentation

- **DESIGN_SYSTEM.md** - Design guidelines (⭐ authoritative)
- **SCHEMA_GUIDE.md** - Effect Schema patterns
- **STORYBOOK.md** - Component development
- **RESPONSIBILITY.md** - Responsibility finder feature
- **ORGANOGRAM.md** - Organigram feature (⚠️ has issues)
- **SECURITY.md** - Security policies
- **MIGRATION_PLAN.md** - Migration tracking

### Claude Code Documentation

- **.claude/CLAUDE.local.md** - Project instructions
- **.claude/WORKFLOW.md** - Git workflow
- **.claude/SETUP_VERIFICATION.md** - Setup guide
- **.claude/skills/** - Drupal API and migration skills

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Effect Documentation](https://effect.website/docs)
- [Drupal JSON:API](https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module)

---

## 🐛 Known Issues

### Critical

- **Organigram unusable** (#437-440) - Readability, navigation, UX problems

### High Priority

- **Responsibility Finder incomplete** (#429) - Only 15 questions, needs more
- **Storybook coverage low** (#441-444) - ~55+ components need stories

### See All Issues

- [GitHub Issues](https://github.com/soniCaH/kcvv-nextjs/issues)

---

## 📞 Support

### For Developers

- Check documentation files (listed above)
- Review code comments
- Run `npm run migration:status` for progress
- See `.claude/` files for Claude Code integration

### For Questions

- Create a [GitHub issue](https://github.com/soniCaH/kcvv-nextjs/issues)
- Email: [kevin@kcvvelewijt.be](mailto:kevin@kcvvelewijt.be)

---

## 📄 License

Copyright © 2025 KCVV Elewijt. All rights reserved.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) by Vercel
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Type safety with [Effect](https://effect.website/)
- Developed with assistance from [Claude Code](https://claude.com/claude-code)

---

**Last Updated:** December 2025
**Version:** 1.0.0-beta
**Status:** 🚧 Migration in Progress

/**
 * Commitlint Configuration
 * Enforces conventional commit format: type(scope): subject
 *
 * Examples:
 * ✅ feat(news): add article detail page
 * ✅ fix(sponsors): resolve logo alignment issue
 * ✅ docs(config): update setup instructions
 * ✅ feat(events): add event detail page
 */

module.exports = {
  extends: ["@commitlint/config-conventional"],

  rules: {
    // Allowed types
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation
        "style", // Code style (formatting, etc.)
        "refactor", // Code refactoring
        "perf", // Performance improvement
        "test", // Adding/updating tests
        "build", // Build system changes
        "ci", // CI configuration
        "chore", // Maintenance tasks
        "revert", // Revert previous commit
      ],
    ],

    // Allowed scopes
    "scope-enum": [
      2,
      "always",
      [
        "news", // News/articles feature
        "matches", // Matches feature
        "events", // Events feature
        "teams", // Teams feature
        "players", // Players feature
        "sponsors", // Sponsors feature
        "calendar", // Calendar feature
        "ranking", // Ranking feature
        "search", // Search feature (Vectorize / Workers AI)
        "sync", // PSD sync pipeline
        "analytics", // Analytics / GTM / GA4
        "studio", // Sanity Studio
        "api", // API/data fetching
        "ui", // UI components
        "schema", // Data schemas
        "config", // Configuration
        "deps", // Dependencies
        "deps-dev", // Dev-only dependencies
      ],
    ],
  },

  // Custom help message
  helpUrl: "https://www.conventionalcommits.org/",

  // Custom prompt configuration
  prompt: {
    messages: {
      type: "Select the type of change you're committing:",
      scope: "Select the scope of this change (optional):",
      subject: "Write a short description:",
      body: "Provide a longer description (optional):",
      footer: "List any breaking changes or issues closed (optional):",
    },

    questions: {
      type: {
        description: "Select the type of change that you're committing",
        enum: {
          feat: {
            description: "A new feature",
            title: "Features",
            emoji: "✨",
          },
          fix: {
            description: "A bug fix",
            title: "Bug Fixes",
            emoji: "🐛",
          },
          docs: {
            description: "Documentation only changes",
            title: "Documentation",
            emoji: "📚",
          },
          style: {
            description:
              "Code style changes (formatting, missing semicolons, etc.)",
            title: "Styles",
            emoji: "💎",
          },
          refactor: {
            description:
              "Code refactoring (neither fixes a bug nor adds a feature)",
            title: "Code Refactoring",
            emoji: "📦",
          },
          perf: {
            description: "Performance improvements",
            title: "Performance Improvements",
            emoji: "🚀",
          },
          test: {
            description: "Adding or updating tests",
            title: "Tests",
            emoji: "🚨",
          },
          build: {
            description: "Build system or external dependencies",
            title: "Builds",
            emoji: "🛠",
          },
          ci: {
            description: "CI configuration changes",
            title: "Continuous Integrations",
            emoji: "⚙️",
          },
          chore: {
            description: "Other changes that don't modify src or test files",
            title: "Chores",
            emoji: "♻️",
          },
          revert: {
            description: "Reverts a previous commit",
            title: "Reverts",
            emoji: "🗑",
          },
        },
      },
      scope: {
        description:
          "What is the scope of this change (e.g., component, file, or feature)?",
      },
      subject: {
        description:
          "Write a short, imperative tense description of the change (e.g., 'add feature' not 'added feature')",
      },
    },
  },
};

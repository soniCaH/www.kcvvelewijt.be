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
};

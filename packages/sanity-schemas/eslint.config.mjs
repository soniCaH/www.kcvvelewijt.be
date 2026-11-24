import studio from "@sanity/eslint-config-studio";
import { builtinRules } from "eslint/use-at-your-own-risk";

// `no-restricted-syntax` registered under its own rule ID (as apps/web does),
// so a later config block can never replace this rule's options (#3717).
const kcvvPlugin = {
  rules: { "no-let": builtinRules.get("no-restricted-syntax") },
};

// Twin of the other Sanity package's eslint.config.mjs (sanity-studio ↔ sanity-schemas) — change both.
export default [
  ...studio,
  {
    // ponytail: pinned instead of "detect" — eslint-plugin-react's version
    // sniffer calls the `context.getFilename()` API that ESLint 10 removed.
    // Bump this when React majors; drop it when the plugin supports v10.
    settings: {
      react: {
        version: "19.2",
      },
    },
  },
  {
    files: ["**/*.ts?(x)"],
    rules: {
      "typescript/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    plugins: { kcvv: kcvvPlugin },
    rules: {
      "kcvv/no-let": [
        "error",
        {
          selector: 'VariableDeclaration[kind="let"]',
          message:
            "No `let` — use `const` (a `let` + `try/catch` becomes a helper that returns; a counter becomes `reduce`/`map`). Rule: #3717.",
        },
      ],
    },
  },
];

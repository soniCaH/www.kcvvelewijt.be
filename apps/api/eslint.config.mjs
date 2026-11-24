import { builtinRules } from "eslint/use-at-your-own-risk";
import tseslint from "typescript-eslint";

// `no-restricted-syntax` registered under its own rule ID (as apps/web does),
// so a later config block can never replace this rule's options (#3717).
const kcvvPlugin = {
  rules: { "no-let": builtinRules.get("no-restricted-syntax") },
};

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    plugins: { kcvv: kcvvPlugin },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-nested-ternary": "error",
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
  {
    ignores: ["node_modules/**", "dist/**", ".wrangler/**", "coverage/**"],
  },
);

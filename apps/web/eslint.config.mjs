import { fileURLToPath } from "url";
import path from "path";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import storybook from "eslint-plugin-storybook";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...storybook.configs["flat/recommended"],
  {
    settings: {
      next: {
        rootDir: __dirname,
      },
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "storybook-static/**",
      "coverage/**",
      "scripts/**",
      "next-env.d.ts",
    ],
  },
  {
    // Allow unused variables that start with underscore (common convention)
    rules: {
      "@typescript-eslint/no-unused-vars": [
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
    // Disable img-related rules for test files where we mock Next.js Image
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
    },
  },
];

export default eslintConfig;

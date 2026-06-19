import studio from "@sanity/eslint-config-studio";

export default [
  ...studio,
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
];

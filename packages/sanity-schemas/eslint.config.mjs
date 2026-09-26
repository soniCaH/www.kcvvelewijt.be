import studio from "@sanity/eslint-config-studio";

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
];

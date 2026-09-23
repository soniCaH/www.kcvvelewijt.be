import { getJestConfig } from "@storybook/test-runner";

// apps/web has no `"type": "module"`, so this file must be .mjs to use ESM.
//
// @storybook/test-runner globs `test-runner-jest*` inside the Storybook config
// dir and uses whatever it finds instead of its own default. We take that
// default wholesale and add `setupFiles`: Jest runs those before the
// `setupFilesAfterEnv` entries the test-runner itself depends on, which is the
// window we need. See allow-module-register.cjs for what happens in there.
const base = getJestConfig();
const config = {
  ...base,
  setupFiles: ["<rootDir>/apps/web/.storybook/allow-module-register.cjs"],
  // On Actions, Jest's built-in reporter turns each failed story into a
  // check-run annotation — which is how the red-main alert names it (#3134).
  reporters: process.env.GITHUB_ACTIONS
    ? [...base.reporters, "github-actions"]
    : base.reporters,
};

export default config;

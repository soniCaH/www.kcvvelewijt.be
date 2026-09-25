/**
 * The package root, so a script's output file lands in one place whatever
 * folder the script sits in and whatever cwd it is run from. Resolve a file
 * with `new URL("name.json", packageRoot)`.
 */
export const packageRoot = new URL("../../", import.meta.url);

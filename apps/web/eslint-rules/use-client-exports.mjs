// A `'use client'` file exports components and types only (#3839).
//
// Next replaces every value a Server Component imports from a client module with a
// client reference: a constant, helper or hook comes through as a proxy, not the value,
// and the failure shows only at runtime. A value that is not a component belongs in a
// plain module that both sides import.
//
// shortcut: "component" means a PascalCase name. A camelCase component is flagged; rename
// it or move it out. A PascalCase value passes unless it is a `createContext(...)` call
// declared in the same file, so a PascalCase object, class instance or `memo(...)` of a
// non-component still slips through. A default export always passes: Next pages, layouts
// and a lone component file default-export. Upgrade to type information if one slips through.
// A lowercase letter somewhere keeps SCREAMING_CASE constants (`CATEGORY_META`) out.
const isComponentName = (name) =>
  /^[A-Z]/.test(name) && (/[a-z]/.test(name) || name.length === 1);

// `createContext(...)` and `React.createContext(...)`.
const isCreateContextCall = (node) =>
  node?.type === "CallExpression" &&
  (node.callee.name === "createContext" ||
    node.callee.property?.name === "createContext");

const hasUseClientDirective = (program) =>
  program.body
    .filter((node) => node.type === "ExpressionStatement" && node.directive)
    .some((node) => node.directive === "use client");

/** @type {import("eslint").Rule.RuleModule} */
export const useClientExports = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      valueExport:
        "'use client' files export components and types only; `{{name}}` is neither. A Server Component that imports it gets a client reference, not the value. Move it to a plain module both sides import.",
    },
  },
  create(context) {
    const state = { isClientFile: false, contexts: new Set() };
    const report = (node, name) =>
      context.report({ node, messageId: "valueExport", data: { name } });

    return {
      Program(program) {
        state.isClientFile = hasUseClientDirective(program);
        // Contexts declared at the top level, exported or not: `export { Ctx }` names one too.
        for (const node of program.body) {
          const declaration =
            node.type === "ExportNamedDeclaration" ? node.declaration : node;
          if (declaration?.type !== "VariableDeclaration") continue;
          for (const declarator of declaration.declarations) {
            if (
              declarator.id.type === "Identifier" &&
              isCreateContextCall(declarator.init)
            ) {
              state.contexts.add(declarator.id.name);
            }
          }
        }
      },
      ExportAllDeclaration(node) {
        if (!state.isClientFile || node.exportKind === "type") return;
        report(node, node.exported ? node.exported.name : "*");
      },
      ExportNamedDeclaration(node) {
        if (!state.isClientFile || node.exportKind === "type") return;
        for (const specifier of node.specifiers) {
          const name = specifier.exported.name ?? specifier.exported.value;
          if (specifier.exportKind === "type" || name === "default") continue;
          const localName = specifier.local.name ?? specifier.local.value;
          if (!isComponentName(name) || state.contexts.has(localName)) {
            report(specifier, name);
          }
        }
        const declaration = node.declaration;
        if (!declaration) return;
        switch (declaration.type) {
          case "TSTypeAliasDeclaration":
          case "TSInterfaceDeclaration":
          case "TSDeclareFunction":
            return;
          case "VariableDeclaration":
            for (const declarator of declaration.declarations) {
              if (declarator.id.type !== "Identifier") {
                report(declarator, "a destructured binding");
              } else if (
                !isComponentName(declarator.id.name) ||
                isCreateContextCall(declarator.init)
              ) {
                report(declarator, declarator.id.name);
              }
            }
            return;
          case "TSEnumDeclaration":
            // An enum is a value however it is named.
            report(declaration, declaration.id.name);
            return;
          default:
            // Function and class declarations carry an `id`.
            if (!declaration.id || !isComponentName(declaration.id.name)) {
              report(
                declaration,
                declaration.id?.name ?? "an anonymous export",
              );
            }
        }
      },
    };
  },
};

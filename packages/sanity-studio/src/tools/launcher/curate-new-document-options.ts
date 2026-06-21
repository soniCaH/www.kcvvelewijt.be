import type {TemplateItem} from 'sanity'

import {launcherTemplates} from '../../templates'

/**
 * Pure filter — drops every `TemplateItem` whose `templateId` is one of
 * `curatedSchemaTypes`. Sanity ids a document type's auto-generated default
 * initial-value template after the type itself (`defaultTemplateForType` →
 * `id: schemaType.name`), so those ids ARE the schema-type names. Curated
 * launcher templates use compound ids (`sponsor-new`, `article-interview`) and
 * are therefore never dropped. `TemplateItem` exposes only `templateId` (no
 * `schemaType`), so this id-based check is the available signal.
 *
 * Lives in its own file (separate from any React/Studio runtime) so the vitest
 * suite can import it without dragging Sanity's CSS bundle into the graph.
 */
export function curateDefaultTemplateItems(
  prev: ReadonlyArray<TemplateItem>,
  curatedSchemaTypes: ReadonlySet<string>,
): TemplateItem[] {
  return prev.filter((item) => !curatedSchemaTypes.has(item.templateId))
}

const CURATED_SCHEMA_TYPES: ReadonlySet<string> = new Set(launcherTemplates.map((t) => t.schemaType))

/**
 * `document.newDocumentOptions` resolver wired identically in both studios.
 * Hides the auto-generated "+ Type" default for any document type that has a
 * curated launcher template, so the global `+` menu (and the structure /
 * reference create menus) show only the curated cards — never a bare "+ Type"
 * default beside a "+ Nieuwe type".
 *
 * Types WITHOUT a launcher template keep their default and stay creatable; the
 * menu converges to fully-curated as the propagation series adds a card per
 * type. Reads the `launcherTemplates` aggregate, so a new type needs no extra
 * wiring here — only its manifest in the aggregate.
 *
 * The `context` arg is ignored: defaults are hidden in every creation context
 * (global / structure / reference) for a consistent curated experience.
 */
export function curatedNewDocumentOptions(prev: TemplateItem[]): TemplateItem[] {
  return curateDefaultTemplateItems(prev, CURATED_SCHEMA_TYPES)
}

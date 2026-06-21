import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {
  LinkToPsdAction,
  launcherTool,
  launcherTemplates,
  curatedNewDocumentOptions,
  guidedSidebarInspectors,
} from '@kcvv/sanity-studio'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'kcvv-elewijt',

  projectId: 'vhb33jaz',
  dataset: (process.env.SANITY_STUDIO_DATASET as string) || 'production',

  plugins: [structureTool({structure}), visionTool()],

  tools: (prev) => [...prev, launcherTool()],

  schema: {
    types: schemaTypes,
    templates: (prev) => [...prev, ...launcherTemplates],
  },

  document: {
    actions: (prev) => [...prev, LinkToPsdAction],
    newDocumentOptions: curatedNewDocumentOptions,
    inspectors: guidedSidebarInspectors,
  },
})

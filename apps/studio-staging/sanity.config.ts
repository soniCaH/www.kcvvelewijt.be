import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {
  LinkToPsdAction,
  RemovePsdImageAction,
  withPublishedAtDefault,
  launcherTool,
  launcherTemplates,
  curatedNewDocumentOptions,
  GuideFormInput,
  createPreviewAction,
} from '@kcvv/sanity-studio'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

// "Voorbeeld" opens the web app run locally (port 3000) against the staging dataset; never the production site.
const PreviewAction = createPreviewAction({webOrigin: 'http://localhost:3000'})

export default defineConfig({
  name: 'default',
  title: 'kcvv-elewijt',

  projectId: 'vhb33jaz',
  dataset: 'staging',

  plugins: [structureTool({structure}), visionTool()],

  tools: (prev) => [...prev, launcherTool()],

  schema: {
    types: schemaTypes,
    templates: (prev) => [...prev, ...launcherTemplates],
  },

  document: {
    actions: (prev, {schemaType}) => [
      ...prev.map((action) =>
        schemaType === 'article' && action.action === 'publish' ? withPublishedAtDefault(action) : action,
      ),
      LinkToPsdAction,
      RemovePsdImageAction,
      // Article only for now (#3658); Event, Page and photo gallery follow in #3660.
      ...(schemaType === 'article' ? [PreviewAction] : []),
    ],
    newDocumentOptions: curatedNewDocumentOptions,
  },

  form: {
    components: {input: GuideFormInput},
  },
})

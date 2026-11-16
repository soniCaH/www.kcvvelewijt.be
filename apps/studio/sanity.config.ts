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
  hasPreviewPath,
} from '@kcvv/sanity-studio'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

// "Voorbeeld" opens the production site, which reads this Studio's dataset.
const PreviewAction = createPreviewAction({webOrigin: 'https://www.kcvvelewijt.be'})

export default defineConfig({
  name: 'default',
  title: 'kcvv-elewijt',

  projectId: 'vhb33jaz',
  dataset: 'production',

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
      // Article, Event, Page and photo gallery (#3658, #3660): one table in `buildPreviewPath`.
      ...(hasPreviewPath(schemaType) ? [PreviewAction] : []),
    ],
    newDocumentOptions: curatedNewDocumentOptions,
  },

  form: {
    components: {input: GuideFormInput},
  },
})

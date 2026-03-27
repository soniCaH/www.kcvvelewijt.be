import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'kcvv-elewijt',

  projectId: 'vhb33jaz',
  dataset: (() => {
    const ds = process.env.SANITY_STUDIO_DATASET as string | undefined
    if (!ds) throw new Error('SANITY_STUDIO_DATASET env var is required for the staging studio')
    return ds
  })(),

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
  },
})

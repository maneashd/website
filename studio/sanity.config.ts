import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'CLVCH',

  projectId: 'yi9utzrz',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  // "Open preview" in a location's document menu goes to its live page
  document: {
    productionUrl: async (prev, {document}) =>
      document._type === 'location' && typeof document.id === 'string' && document.id
        ? `https://www.clvchusa.com/locations/${document.id}`
        : prev,
  },
})

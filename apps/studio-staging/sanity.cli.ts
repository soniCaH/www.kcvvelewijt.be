import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'vhb33jaz',
    dataset: 'production'
  },
  deployment: {
    appId: 'jkabcua9cn3yjd8wvcyfybyz',
    autoUpdates: true,
  }
})

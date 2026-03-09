import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'vhb33jaz',
    dataset: 'production'
  },
  deployment: {
    appId: 'spu38xebdj9gax6q21ibckzf',
    autoUpdates: true,
  }
})

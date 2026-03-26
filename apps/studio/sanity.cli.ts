import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'vhb33jaz',
    dataset: 'production',
  },
  deployment: {
    appId: 'spu38xebdj9gax6q21ibckzf',
    autoUpdates: true,
  },
  typegen: {
    path: '../web/src/lib/repositories/*.ts',
    generates: '../web/src/lib/sanity/sanity.types.ts',
  },
})

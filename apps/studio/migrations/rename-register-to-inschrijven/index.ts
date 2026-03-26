import {defineMigration, at, setIfMissing, unset, set} from 'sanity/migrate'

/**
 * Rename the page document slug from "register" to "inschrijven".
 * Part of #1078 — Dutch URL renames phase 2.
 *
 * Run with: npx sanity@latest migration run rename-register-to-inschrijven --project vhb33jaz --dataset production
 */
export default defineMigration({
  title: 'Rename page slug register → inschrijven',
  documentTypes: ['page'],

  migrate: {
    document(doc) {
      if (doc.slug?.current === 'register') {
        return [at('slug.current', set('inschrijven'))]
      }
    },
  },
})

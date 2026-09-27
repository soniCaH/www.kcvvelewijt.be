/**
 * AUDIT-ONLY — logs every event/transfer article missing its required
 * eventFact/transferFact block. Mutates nothing; rerun until clean.
 *
 * Logic + tests live in `@kcvv/sanity-studio/migrations`. This file is the
 * Sanity CLI entry point for the production studio.
 *
 * Dry-run (the CLI default):
 *   npx sanity@latest migration run audit-fact-blocks --project vhb33jaz --dataset production
 */
import {auditFactBlocksMigration} from '@kcvv/sanity-studio/migrations'

export default auditFactBlocksMigration

/**
 * Staging counterpart to `apps/studio/migrations/interview-subject-to-subjects/`.
 * See that file for the full contract — both migrations share the same
 * source in `@kcvv/sanity-studio`.
 *
 * Run against staging first (only dataset with interview test docs):
 *   npx sanity@latest migration run interview-subject-to-subjects --project vhb33jaz --dataset staging --dry-run
 *   npx sanity@latest migration run interview-subject-to-subjects --project vhb33jaz --dataset staging
 */
import {interviewSubjectToSubjectsMigration} from '@kcvv/sanity-studio'

export default interviewSubjectToSubjectsMigration

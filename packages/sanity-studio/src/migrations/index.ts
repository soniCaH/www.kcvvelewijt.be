// React-free barrel for Sanity migrations. The Sanity CLI's migration
// loader resolves TypeScript but doesn't know about JSX, so it can't
// touch the main `@kcvv/sanity-studio` entry (which re-exports React
// input components). Import migrations via
// `@kcvv/sanity-studio/migrations` to keep the CLI happy.

export {
  default as interviewSubjectToSubjectsMigration,
  migrateInterviewSubjectToSubjects,
} from './interview-subject-to-subjects'
export type {InterviewArticleDoc} from './interview-subject-to-subjects'

export {
  default as mergeRelatedArticlesIntoRelatedContentMigration,
  migrateMergeRelatedArticlesIntoRelatedContent,
} from './merge-related-articles-into-related-content'
export type {
  ArticleDoc as RelatedContentArticleDoc,
  RelatedRef,
} from './merge-related-articles-into-related-content'

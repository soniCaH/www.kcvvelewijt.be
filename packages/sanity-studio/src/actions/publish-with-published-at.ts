import {type DocumentActionComponent, useDocumentOperation} from 'sanity'

/**
 * Wraps the built-in Publish action: an article published with an empty
 * `publishedAt` gets "now". The site only shows articles with
 * `publishedAt <= now()`, so an empty field meant a published-but-invisible
 * article until an editor filled the date by hand.
 */
export function withPublishedAtDefault(Publish: DocumentActionComponent): DocumentActionComponent {
  const PublishWithPublishedAt: DocumentActionComponent = (props) => {
    const {patch} = useDocumentOperation(props.id, props.type)
    const original = Publish(props)
    if (!original) return original
    return {
      ...original,
      onHandle: () => {
        if (!props.draft?.publishedAt) {
          patch.execute([{setIfMissing: {publishedAt: new Date().toISOString()}}])
        }
        original.onHandle?.()
      },
    }
  }
  PublishWithPublishedAt.action = Publish.action
  return PublishWithPublishedAt
}

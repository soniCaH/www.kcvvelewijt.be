import {useState} from 'react'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {useToast} from '@sanity/ui/toast'
import {createPreviewSecret} from '@sanity/preview-url-secret/create-secret'
import {type DocumentActionComponent, useClient, useCurrentUser} from 'sanity'
import {buildPreviewPath, hasPreviewPath} from './build-preview-path'

const API_VERSION = '2024-01-01'
const NO_SLUG_HELP = 'Vul eerst een URL (slug) in om een voorbeeld te bekijken.'

/**
 * "Voorbeeld" Document Action (#3619, Slice A).
 *
 * Writes a short-lived, per-user preview secret to the dataset with the
 * editor's own Studio session, then opens the web app's enable endpoint with
 * that secret and the document's public path in a new tab. The endpoint checks
 * the secret server-side and turns on preview mode, so the page shows the
 * unpublished change. The Studio holds no token and nothing to configure but
 * `webOrigin`: each Studio passes the one site that reads its own dataset.
 *
 * Hidden on types without a public path; disabled while the slug is empty.
 * The slug comes from the draft, so an unpublished slug change previews at the
 * new path.
 */
export const createPreviewAction = ({webOrigin}: {webOrigin: string}): DocumentActionComponent => {
  const PreviewAction: DocumentActionComponent = (props) => {
    const {type, draft, published} = props
    const client = useClient({apiVersion: API_VERSION})
    const user = useCurrentUser()
    const toast = useToast()
    const [busy, setBusy] = useState(false)

    const slug = ((draft || published)?.slug as {current?: string} | undefined)?.current
    const path = buildPreviewPath(type, slug)
    // An unsupported type has no public page whatever its slug is: hide, don't disable.
    if (!hasPreviewPath(type)) return null

    return {
      label: 'Voorbeeld',
      icon: EyeOpenIcon,
      disabled: !path || busy,
      title: path ? undefined : NO_SLUG_HELP,
      onHandle: async () => {
        if (!path) return
        // Open the tab inside the click: a window opened after an `await` is
        // treated as a popup and blocked.
        const tab = window.open('', '_blank')
        if (!tab) {
          toast.push({
            status: 'warning',
            title: 'Pop-up geblokkeerd',
            description: 'Sta pop-ups toe voor deze site om het voorbeeld te openen.',
          })
          return
        }
        tab.opener = null
        setBusy(true)
        try {
          const {secret} = await createPreviewSecret(
            client,
            'kcvv-voorbeeld',
            window.location.origin,
            user?.id,
          )
          const url = new URL('/api/preview/enable', webOrigin)
          url.searchParams.set('sanity-preview-secret', secret)
          url.searchParams.set('sanity-preview-pathname', path)
          tab.location.href = url.toString()
        } catch {
          tab.close()
          toast.push({
            status: 'error',
            title: 'Voorbeeld openen mislukt',
            description: 'Het voorbeeld kon niet worden aangemaakt. Probeer het opnieuw.',
          })
        } finally {
          setBusy(false)
          props.onComplete()
        }
      },
    }
  }
  PreviewAction.displayName = 'PreviewAction'
  return PreviewAction
}

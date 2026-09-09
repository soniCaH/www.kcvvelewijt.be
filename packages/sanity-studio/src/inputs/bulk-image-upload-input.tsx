import {UploadIcon} from '@sanity/icons/Upload'
import {Button, Stack} from '@sanity/ui'
import {useRef, type ChangeEvent, type JSX} from 'react'
import {useFormBuilder, type ArrayOfObjectsInputProps} from 'sanity'
import {fanOutSelectedFiles} from './fan-out-selected-files'

/**
 * Array input that adds a guaranteed bulk-upload path — a "Foto's uploaden"
 * button opening a multi-select file dialog — alongside the native input.
 * A file dialog works regardless of drag-event health or SPA arming (#2371),
 * which is why the button carries the guarantee and drag-drop/paste stay the
 * untouched fast path.
 *
 * Generic against `ArrayOfObjectsInputProps`; scope it to a single-member
 * image array via `applyBulkImageUploadInput`. When the native entry point or
 * an upload-capable asset source is missing, renders only the default input —
 * no dead button.
 */
export function BulkImageUploadInput(props: ArrayOfObjectsInputProps): JSX.Element {
  const {onSelectFile, readOnly, schemaType} = props
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const {image} = useFormBuilder().__internal
  // Mirrors Sanity's own `resolveUploadAssetSources`: no sources when direct
  // uploads are disabled; prefer sources that can upload, else fall back.
  const assetSource = image.directUploads
    ? (image.assetSources.find((source) => Boolean(source.Uploader)) ?? image.assetSources[0])
    : undefined
  const imageMember = schemaType.of[0]

  if (!onSelectFile || !assetSource || !imageMember) {
    return props.renderDefault(props)
  }

  const handleFilesPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? [])
    fanOutSelectedFiles(files, {imageMember, assetSource, onSelectFile})
    // Re-picking the same files must fire `change` again.
    event.currentTarget.value = ''
  }

  return (
    <Stack gap={3} data-ui="BulkImageUploadInput">
      {props.renderDefault(props)}
      <Button
        icon={UploadIcon}
        text="Foto's uploaden"
        mode="ghost"
        disabled={readOnly}
        onClick={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{display: 'none'}}
        onChange={handleFilesPicked}
      />
    </Stack>
  )
}

BulkImageUploadInput.displayName = 'BulkImageUploadInput'

import { resolveImageUrl } from '../../utils/images';

export default function StepImages({
  images,
  onAdd,
  onRemove,
  error,
  maxImages,
  existingImages = [],
  onRemoveExisting,
}) {
  const handleChange = (event) => {
    if (event.target.files?.length) {
      onAdd(event.target.files);
    }
    // Reset so selecting the same file again after removal still fires onChange.
    event.target.value = '';
  };

  // Existing (already-uploaded) images count toward the same combined limit
  // as new-upload previews — both together can never exceed `maxImages`.
  const totalCount = existingImages.length + images.length;
  const atLimit = totalCount >= maxImages;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div>
        <p className="field-label">
          Images ({totalCount}/{maxImages})
        </p>

        {/* The real <input> is visually hidden (sr-only) — a focus outline
            on it would be invisible, so show the ring on this label instead
            whenever the hidden input inside it has keyboard focus. */}
        <label
          htmlFor="ad-images"
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 ${
            atLimit
              ? 'cursor-not-allowed border-border bg-surface-muted text-gray-500'
              : 'border-primary/40 bg-primary/5 text-primary hover:border-primary hover:bg-primary/10'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
          <span className="text-sm font-semibold">
            {atLimit ? 'Maximum images reached' : 'Tap to add photos'}
          </span>
          <span className="text-xs text-gray-500">
            Up to {maxImages} images &middot; JPEG, PNG, WEBP or GIF &middot; max 400KB each
          </span>
          <input
            id="ad-images"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleChange}
            disabled={atLimit}
            className="sr-only"
          />
        </label>
        {error && <p className="field-error">{error}</p>}
      </div>

      {(existingImages.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {existingImages.map((imagePath, index) => (
            <div key={imagePath} className="relative aspect-square rounded-md border border-border">
              <div className="h-full w-full overflow-hidden rounded-md">
                <img
                  src={resolveImageUrl(imagePath)}
                  alt={`Existing photo ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemoveExisting?.(imagePath)}
                aria-label={`Remove existing image ${index + 1}`}
                className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm font-bold text-white shadow hover:bg-primary"
              >
                &times;
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Cover
                </span>
              )}
            </div>
          ))}
          {images.map((image, index) => (
            <div key={image.preview} className="relative aspect-square rounded-md border border-border">
              <div className="h-full w-full overflow-hidden rounded-md">
                <img
                  src={image.preview}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove image ${index + 1}`}
                className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm font-bold text-white shadow hover:bg-primary"
              >
                &times;
              </button>
              {existingImages.length === 0 && index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

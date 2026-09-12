export default function StepReview({ form, images, categories }) {
  const categoryName = categories.find((cat) => cat._id === form.category)?.name || '—';

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-ink">Review your ad</h2>
        <p className="text-xs text-gray-500">Make sure everything looks right before you submit.</p>
      </div>

      {images.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <img
              key={image.preview}
              src={image.preview}
              alt={index === 0 ? 'Cover photo' : `Photo ${index + 1}`}
              className={`h-20 w-20 shrink-0 rounded-md object-cover ${
                index === 0 ? 'ring-2 ring-primary ring-offset-1' : 'border border-border'
              }`}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border bg-surface-muted p-3 text-xs text-gray-500">
          No photos added — ads with photos usually get more responses.
        </p>
      )}

      <dl className="divide-y divide-border text-sm">
        <div className="grid grid-cols-3 gap-2 py-2.5">
          <dt className="text-gray-500">Title</dt>
          <dd className="col-span-2 font-medium text-ink">{form.title}</dd>
        </div>
        <div className="grid grid-cols-3 gap-2 py-2.5">
          <dt className="text-gray-500">Description</dt>
          <dd className="col-span-2 whitespace-pre-wrap text-ink">{form.description}</dd>
        </div>
        <div className="grid grid-cols-3 gap-2 py-2.5">
          <dt className="text-gray-500">Category</dt>
          <dd className="col-span-2 text-ink">{categoryName}</dd>
        </div>
        <div className="grid grid-cols-3 gap-2 py-2.5">
          <dt className="text-gray-500">WhatsApp</dt>
          <dd className="col-span-2 text-ink">{form.whatsappNumber}</dd>
        </div>
        {form.telegramUsername && (
          <div className="grid grid-cols-3 gap-2 py-2.5">
            <dt className="text-gray-500">Telegram</dt>
            <dd className="col-span-2 text-ink">{form.telegramUsername}</dd>
          </div>
        )}
        {form.city && (
          <div className="grid grid-cols-3 gap-2 py-2.5">
            <dt className="text-gray-500">City</dt>
            <dd className="col-span-2 text-ink">{form.city}</dd>
          </div>
        )}
      </dl>

      <p className="rounded-md bg-primary/5 p-3 text-xs text-ink-light">
        After you submit, you&apos;ll be taken to <span className="font-semibold">Checkout</span> to
        complete a manual bank transfer and confirm your payment.
      </p>
    </div>
  );
}

export default function StepDetails({ form, updateField, fieldErrors }) {
  return (
    <div className="space-y-5 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div>
        <label htmlFor="title" className="field-label">
          Title <span className="text-primary">*</span>
        </label>
        <input
          id="title"
          value={form.title}
          maxLength={120}
          onChange={(event) => updateField('title', event.target.value)}
          placeholder="e.g. iPhone 13 Pro - Excellent Condition"
          aria-invalid={Boolean(fieldErrors.title)}
          className={`input-field ${fieldErrors.title ? 'input-field-error' : ''}`}
        />
        {fieldErrors.title && <p className="field-error">{fieldErrors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="field-label">
          Description <span className="text-primary">*</span>
        </label>
        <textarea
          id="description"
          rows={6}
          maxLength={5000}
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
          placeholder="Describe your item or service in detail — condition, features, why it's a great deal..."
          aria-invalid={Boolean(fieldErrors.description)}
          className={`input-field resize-y ${fieldErrors.description ? 'input-field-error' : ''}`}
        />
        <p className="mt-1 text-right text-xs text-gray-500">{form.description.length}/5000</p>
        {fieldErrors.description && <p className="field-error">{fieldErrors.description}</p>}
      </div>
    </div>
  );
}

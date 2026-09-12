export default function StepCategoryContact({ form, updateField, categories, fieldErrors }) {
  return (
    <div className="space-y-5 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div>
        <label htmlFor="category" className="field-label">
          Category <span className="text-primary">*</span>
        </label>
        <select
          id="category"
          value={form.category}
          onChange={(event) => updateField('category', event.target.value)}
          aria-invalid={Boolean(fieldErrors.category)}
          className={`input-field ${fieldErrors.category ? 'input-field-error' : ''}`}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        {fieldErrors.category && <p className="field-error">{fieldErrors.category}</p>}
      </div>

      <div>
        <label htmlFor="whatsappNumber" className="field-label">
          WhatsApp Number <span className="text-primary">*</span>
        </label>
        <input
          id="whatsappNumber"
          type="tel"
          value={form.whatsappNumber}
          onChange={(event) => updateField('whatsappNumber', event.target.value)}
          placeholder="e.g. +94 71 234 5678"
          aria-invalid={Boolean(fieldErrors.whatsappNumber)}
          className={`input-field ${fieldErrors.whatsappNumber ? 'input-field-error' : ''}`}
        />
        <p className="field-hint">Buyers will contact you on WhatsApp using this number.</p>
        {fieldErrors.whatsappNumber && <p className="field-error">{fieldErrors.whatsappNumber}</p>}
      </div>

      <div>
        <label htmlFor="telegramUsername" className="field-label">
          Telegram Username <span className="text-gray-500">(optional)</span>
        </label>
        <input
          id="telegramUsername"
          value={form.telegramUsername}
          onChange={(event) => updateField('telegramUsername', event.target.value)}
          placeholder="e.g. @yourusername"
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="city" className="field-label">
          City / නගරය <span className="text-gray-500">(optional)</span>
        </label>
        <input
          id="city"
          value={form.city}
          onChange={(event) => updateField('city', event.target.value)}
          placeholder="e.g. Colombo, Kandy, Galle"
          maxLength={100}
          className="input-field"
        />
      </div>
    </div>
  );
}

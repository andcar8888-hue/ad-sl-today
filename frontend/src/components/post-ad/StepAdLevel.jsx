/** Small bolt glyph used on time-limited (durationDays set) boost tiers —
 * reads as "urgent/flashier" boost, paired with the red treatment. */
function BoltIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6z" />
    </svg>
  );
}

/** Small star glyph used on non-time-limited boost tiers — reads as a
 * steady, "evergreen" boost rather than a time-limited push. */
function StarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5l2.7 6.06 6.6.62-4.98 4.42 1.47 6.47L12 16.9l-5.79 3.17 1.47-6.47-4.98-4.42 6.6-.62L12 2.5z" />
    </svg>
  );
}

/** Plain dot glyph for the lowest-priced tier(s) in the list — deliberately
 * the least visually "loud" option. */
function DotIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3.5 2" />
    </svg>
  );
}

/**
 * Works out a purely structural visual "weight" for a level relative to the
 * other active levels — never keyed off the level's name (admins can rename
 * levels freely, so a name-based lookup would silently stop working).
 *
 * - `bucket` scales with price rank among the currently offered levels
 *   ('base' cheapest third, 'mid' middle third, 'premium' priciest third).
 * - `isTimeLimited` (durationDays set) picks the icon glyph — a bolt reads
 *   as the flashier, time-boxed boost; a star reads as a steady one.
 */
function getTierVisual(level, sortedByPriceAsc) {
  const isTimeLimited = Boolean(level.durationDays);
  const maxIndex = sortedByPriceAsc.length - 1;
  const rankIndex = sortedByPriceAsc.findIndex((item) => item._id === level._id);
  // All levels priced the same (or only one level) -> treat as a neutral
  // "mid" bucket rather than assuming premium.
  const rankRatio = maxIndex > 0 ? rankIndex / maxIndex : 0.5;

  let bucket = 'base';
  if (rankRatio >= 0.66) bucket = 'premium';
  else if (rankRatio >= 0.33) bucket = 'mid';

  const iconWrapperClass =
    bucket === 'premium'
      ? 'bg-primary text-white'
      : bucket === 'mid'
        ? 'bg-primary/15 text-primary'
        : 'bg-surface-muted text-gray-500 ring-1 ring-border';

  const Icon = isTimeLimited ? BoltIcon : bucket === 'base' ? DotIcon : StarIcon;

  return { isTimeLimited, iconWrapperClass, Icon };
}

export default function StepAdLevel({ form, updateField, adLevels, fieldErrors }) {
  const sortedByPriceAsc = [...adLevels].sort((a, b) => a.price - b.price);

  // "Popular" callout for the middle-priced level — only shown when there's
  // an unambiguous single middle price point (an odd count of *distinct*
  // prices). With an even count there'd be two equally-valid "middle"
  // candidates, and picking one would just be guessing, so we skip it.
  const distinctPricesAsc = [...new Set(adLevels.map((level) => level.price))].sort((a, b) => a - b);
  const popularPrice =
    distinctPricesAsc.length >= 3 && distinctPricesAsc.length % 2 === 1
      ? distinctPricesAsc[(distinctPricesAsc.length - 1) / 2]
      : null;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-ink">
          Ad Level <span className="text-primary">*</span>
        </h2>
        <p className="text-xs text-gray-500">
          Choose a boost tier for your ad. You&apos;ll pay for this via bank transfer at Checkout.
        </p>
      </div>

      <div className="space-y-2">
        {adLevels.map((level) => {
          const isSelected = form.adLevel === level._id;
          const isPopular = popularPrice !== null && level.price === popularPrice;
          const { isTimeLimited, iconWrapperClass, Icon } = getTierVisual(level, sortedByPriceAsc);

          return (
            <label
              key={level._id}
              htmlFor={`ad-level-${level._id}`}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary'
                  : 'border-border hover:bg-surface-muted'
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <input
                  id={`ad-level-${level._id}`}
                  type="radio"
                  name="adLevel"
                  value={level._id}
                  checked={isSelected}
                  onChange={(event) => updateField('adLevel', event.target.value)}
                  className="h-4 w-4 shrink-0 accent-primary"
                />
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconWrapperClass}`}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-ink">{level.name}</span>
                    {isPopular && (
                      <span className="shrink-0 rounded-full bg-ink px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        Popular
                      </span>
                    )}
                  </span>
                  {isTimeLimited && (
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3 shrink-0" />
                      Featured for {level.durationDays} days
                    </span>
                  )}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-right leading-tight">
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    LKR
                  </span>
                  <span className="block text-lg font-extrabold leading-none text-primary">
                    {level.price}
                  </span>
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${
                    isSelected ? 'bg-primary text-white' : 'bg-transparent text-transparent'
                  }`}
                  aria-hidden="true"
                >
                  <CheckIcon className="h-3 w-3" />
                </span>
              </span>
            </label>
          );
        })}
        {adLevels.length === 0 && (
          <p className="rounded-md border border-dashed border-border bg-surface-muted p-3 text-xs text-gray-500">
            No ad levels are currently available.
          </p>
        )}
      </div>

      {fieldErrors.adLevel && <p className="field-error">{fieldErrors.adLevel}</p>}
    </div>
  );
}

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="mt-4">
      <ol className="flex items-start">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isDone = stepNumber < currentStep;
          const isLast = stepNumber === steps.length;

          return (
            <li key={label} className={`flex items-center ${isLast ? 'flex-none' : 'flex-1'}`}>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    isActive
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : isDone
                        ? 'bg-primary text-white'
                        : 'bg-surface-muted text-gray-500 ring-1 ring-inset ring-border'
                  }`}
                >
                  {isDone ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </span>
                <span
                  className={`hidden text-[11px] font-medium sm:block ${
                    isActive ? 'text-ink' : isDone ? 'text-ink-light' : 'text-gray-500'
                  }`}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <span
                  className={`mx-1.5 mt-4 h-0.5 flex-1 sm:mt-[15px] ${isDone ? 'bg-primary' : 'bg-border'}`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-xs font-medium text-gray-500 sm:hidden" aria-live="polite">
        Step {currentStep} of {steps.length}: <span className="text-ink">{steps[currentStep - 1]}</span>
      </p>
    </div>
  );
}

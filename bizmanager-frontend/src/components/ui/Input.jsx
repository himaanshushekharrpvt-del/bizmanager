import clsx from 'clsx'

export default function Input({ label, error, hint, className, id, ...props }) {
  const inputId = id || props.name

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-paper">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'rounded-lg border bg-ink px-3 py-2.5 text-sm text-paper placeholder:text-muted',
          'focus:border-amber focus:outline-none',
          error ? 'border-rust' : 'border-line',
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-rust">{error}</p>}
    </div>
  )
}

import clsx from 'clsx'

export default function Select({ label, error, className, id, children, ...props }) {
  const selectId = id || props.name

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-paper">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'rounded-lg border bg-ink px-3 py-2.5 text-sm text-paper',
          'focus:border-amber focus:outline-none',
          error ? 'border-rust' : 'border-line',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-rust">{error}</p>}
    </div>
  )
}

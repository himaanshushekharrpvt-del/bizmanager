import clsx from 'clsx'

const TONES = {
  teal: 'bg-teal-dim text-teal border-teal/30',
  rust: 'bg-rust-dim text-rust border-rust/30',
  amber: 'bg-amber-dim text-amber border-amber/30',
  indigo: 'bg-indigo-dim text-indigo border-indigo/30',
  muted: 'bg-ink-3 text-muted border-line',
}

export default function Badge({ tone = 'muted', children, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

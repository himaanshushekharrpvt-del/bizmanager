import clsx from 'clsx'

const TONES = {
  paper: 'text-paper',
  amber: 'text-amber',
  teal: 'text-teal',
  rust: 'text-rust',
}

export default function StatCard({ label, value, sublabel, tone = 'paper', icon: Icon }) {
  return (
    <div className="ticket-stub overflow-hidden rounded-2xl border border-line bg-ink-2">
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted">{label}</span>
        {Icon && <Icon size={16} className="text-muted" />}
      </div>
      <div className="stub-tear mx-4 mt-3">
        <span className="stub-notch left" />
        <span className="stub-notch right" />
      </div>
      <div className="px-4 pb-4 pt-3">
        <div className={clsx('font-display text-2xl font-semibold sm:text-3xl', TONES[tone])}>{value}</div>
        {sublabel && <p className="mt-1 text-xs text-muted">{sublabel}</p>}
      </div>
    </div>
  )
}

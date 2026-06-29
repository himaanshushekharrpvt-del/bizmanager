import { useState } from 'react'
import { RANGE_PRESETS, rangeForPreset } from '../../utils/dateRanges'
import clsx from 'clsx'

export default function DateRangeBar({ from, to, onChange }) {
  const [preset, setPreset] = useState('7d')

  const choosePreset = (key) => {
    setPreset(key)
    if (key !== 'custom') {
      onChange(rangeForPreset(key))
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex gap-1 overflow-x-auto">
        {RANGE_PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => choosePreset(p.key)}
            className={clsx(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              preset === p.key ? 'bg-amber text-ink' : 'bg-ink-3 text-muted hover:text-paper',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => onChange({ from: e.target.value, to })}
            className="rounded-lg border border-line bg-ink px-2.5 py-1.5 text-sm text-paper focus:border-amber focus:outline-none"
          />
          <span className="text-muted">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => onChange({ from, to: e.target.value })}
            className="rounded-lg border border-line bg-ink px-2.5 py-1.5 text-sm text-paper focus:border-amber focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}

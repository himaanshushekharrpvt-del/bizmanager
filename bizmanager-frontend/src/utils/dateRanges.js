import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
} from 'date-fns'

const ISO = 'yyyy-MM-dd'

export function toIso(date) {
  return format(date, ISO)
}

/** Returns { from, to } ISO date strings for each preset, anchored on today. */
export function rangeForPreset(preset) {
  const today = new Date()
  switch (preset) {
    case 'today':
      return { from: toIso(today), to: toIso(today) }
    case '7d':
      return { from: toIso(subDays(today, 6)), to: toIso(today) }
    case 'month':
      return { from: toIso(startOfMonth(today)), to: toIso(endOfMonth(today)) }
    case 'year':
      return { from: toIso(startOfYear(today)), to: toIso(endOfYear(today)) }
    default:
      return { from: toIso(subDays(today, 6)), to: toIso(today) }
  }
}

export const RANGE_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
  { key: 'custom', label: 'Custom' },
]

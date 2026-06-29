import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { staffApi } from '../../api/staff'
import { apiErrorMessage } from '../../api/client'
import { todayIso } from '../../utils/format'
import { useToast } from '../../components/ui/Toast'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { Permission } from '../../utils/permissions'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** staffId is omitted in self mode - the backend resolves "me" from the auth token instead. */
export default function AttendanceMonthGrid({ staffId, isSelf = false, refreshKey = 0, onMarked }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [summary, setSummary] = useState(null)
  const [pickedDate, setPickedDate] = useState(null)
  const toast = useToast()
  const { hasAnyPermission } = useAuth()
  const canMark = !isSelf && hasAnyPermission([Permission.MARK_ATTENDANCE])
  const today = todayIso()

  const load = () => {
    const fetcher = isSelf ? staffApi.myMonthlyAttendance(year, month) : staffApi.monthlyAttendance(staffId, year, month)
    fetcher.then(setSummary).catch((e) => toast.error(apiErrorMessage(e)))
  }

  useEffect(() => {
    setSummary(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, staffId, refreshKey])

  const changeMonth = (delta) => {
    let m = month + delta
    let y = year
    if (m < 1) {
      m = 12
      y -= 1
    } else if (m > 12) {
      m = 1
      y += 1
    }
    setMonth(m)
    setYear(y)
  }

  if (!summary) return <Spinner />

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstWeekday = new Date(year, month - 1, 1).getDay() // 0=Sun
  const byDate = new Map(summary.days.map((d) => [d.date, d]))

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ day, iso, record: byDate.get(iso), isToday: iso === today, isFuture: iso > today })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="text-muted hover:text-paper" aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <p className="font-medium text-paper">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        <button onClick={() => changeMonth(1)} className="text-muted hover:text-paper" aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted">
        <span>
          <span className="text-teal">{summary.presentDays}</span> present
        </span>
        <span>
          <span className="text-rust">{summary.absentDays}</span> absent
        </span>
        <span>{summary.attendancePercentage}% attendance</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[11px] text-muted">
            {d}
          </div>
        ))}
        {cells.map((cell, i) =>
          cell === null ? (
            <div key={`empty-${i}`} />
          ) : (
            <button
              key={cell.iso}
              disabled={!canMark || !cell.isToday}
              onClick={() => canMark && cell.isToday && setPickedDate(cell.iso)}
              title={canMark && cell.isToday ? 'Update today' : undefined}
              className={clsx(
                'flex aspect-square items-center justify-center rounded-lg text-xs font-mono transition-colors',
                cell.record?.status === 'PRESENT' && 'bg-teal-dim text-teal',
                cell.record?.status === 'ABSENT' && 'bg-rust-dim text-rust',
                !cell.record && 'bg-ink-3 text-muted',
                cell.isToday && 'ring-1 ring-amber/50',
                canMark && cell.isToday && 'hover:ring-amber',
                canMark && !cell.isToday && 'cursor-default',
                cell.isFuture && 'opacity-45',
              )}
            >
              {cell.day}
            </button>
          ),
        )}
      </div>

      {canMark && (
        <MarkDayModal
          date={pickedDate}
          staffId={staffId}
          onClose={() => setPickedDate(null)}
          onMarked={(attendance) => {
            setPickedDate(null)
            load()
            onMarked?.(attendance)
          }}
        />
      )}
    </div>
  )
}

function MarkDayModal({ date, staffId, onClose, onMarked }) {
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const mark = async (status) => {
    setSaving(true)
    try {
      const attendance = await staffApi.markAttendance(staffId, date, status)
      toast.success(`Marked ${status === 'PRESENT' ? 'present' : 'absent'} for ${date}`)
      onMarked(attendance)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!date} onClose={onClose} title={`Mark attendance · ${date}`}>
      <div className="flex gap-2">
        <Button onClick={() => mark('PRESENT')} loading={saving} className="flex-1">
          Present
        </Button>
        <Button variant="secondary" onClick={() => mark('ABSENT')} loading={saving} className="flex-1">
          Absent
        </Button>
      </div>
    </Modal>
  )
}

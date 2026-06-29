import { useEffect, useState } from 'react'
import { staffApi } from '../../api/staff'
import { apiErrorMessage } from '../../api/client'
import { formatMoney, formatDate, formatDateTime } from '../../utils/format'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import AttendanceMonthGrid from './AttendanceMonthGrid'

export default function MyProfilePage() {
  const [profile, setProfile] = useState(null)
  const [today, setToday] = useState(undefined)
  const [salary, setSalary] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    staffApi.me().then(setProfile).catch((e) => setError(apiErrorMessage(e)))
    staffApi.myTodayAttendance().then(setToday).catch(() => setToday(null))
    staffApi.mySalarySummary().then(setSalary).catch(() => {})
  }, [])

  if (error) {
    return (
      <EmptyState message="No staff profile is linked to your account — there's nothing to show here. Talk to your admin if this seems wrong." />
    )
  }
  if (!profile) return <Spinner />

  return (
    <div>
      <PageHeader eyebrow="My profile" title={profile.name} description={profile.phone} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">Today</p>
            {today === undefined ? (
              <Spinner />
            ) : today ? (
              <div className="flex items-center justify-between">
                <Badge tone={today.status === 'PRESENT' ? 'teal' : 'rust'}>{today.status}</Badge>
                <p className="text-xs text-muted">marked at {formatDateTime(today.markedAt)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted">Not marked yet today.</p>
            )}
          </Card>

          <Card>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">Monthly attendance</p>
            <AttendanceMonthGrid isSelf />
          </Card>
        </div>

        <Card>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">Salary</p>
          <p className="text-xs text-muted">Monthly</p>
          <p className="mb-3 font-mono text-lg text-paper">{formatMoney(profile.monthlySalary)}</p>
          {salary && (
            <>
              <div className="my-3 border-t border-line" />
              <p className="text-xs text-muted">Accruing since {formatDate(salary.accruingSince)}</p>
              <p className="font-mono text-2xl text-amber">{formatMoney(salary.cumulativeSalary)}</p>
              <p className="mt-1 text-xs text-muted">
                {salary.presentDaysSincePaid} present · {salary.absentDaysSincePaid} absent since last payment
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

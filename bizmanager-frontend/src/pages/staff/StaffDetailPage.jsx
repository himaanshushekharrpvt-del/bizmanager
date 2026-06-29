import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Check, X, IndianRupee } from 'lucide-react'
import { staffApi } from '../../api/staff'
import { apiErrorMessage } from '../../api/client'
import { formatMoney, formatDate, formatDateTime, todayIso } from '../../utils/format'
import { useToast } from '../../components/ui/Toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import PermissionGate from '../../components/layout/PermissionGate'
import { Permission } from '../../utils/permissions'
import AttendanceMonthGrid from './AttendanceMonthGrid'

export default function StaffDetailPage() {
  const { id } = useParams()
  const staffId = Number(id)
  const toast = useToast()

  const [profile, setProfile] = useState(null)
  const [today, setToday] = useState(undefined) // undefined = loading, null = not marked
  const [salary, setSalary] = useState(null)
  const [payments, setPayments] = useState(null)
  const [salaryModalOpen, setSalaryModalOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [attendanceVersion, setAttendanceVersion] = useState(0)

  const loadAll = () => {
    staffApi.get(staffId).then(setProfile).catch((e) => toast.error(apiErrorMessage(e)))
    staffApi.todayAttendance(staffId).then(setToday).catch(() => setToday(null))
    staffApi.salarySummary(staffId).then(setSalary).catch((e) => toast.error(apiErrorMessage(e)))
    staffApi.salaryPayments(staffId).then(setPayments).catch(() => setPayments([]))
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId])

  const markToday = async (status) => {
    try {
      const res = await staffApi.markAttendance(staffId, todayIso(), status)
      setToday(res)
      toast.success(`Marked ${status === 'PRESENT' ? 'present' : 'absent'} for today`)
      setAttendanceVersion((v) => v + 1)
      staffApi.salarySummary(staffId).then(setSalary)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  if (!profile) return <Spinner />

  return (
    <div>
      <Link to="/staff" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-paper">
        <ArrowLeft size={14} /> Back to staff
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-paper sm:text-3xl">{profile.name}</h1>
          <p className="text-sm text-muted">
            {profile.phone}
          </p>
        </div>
        <Badge tone={profile.active ? 'teal' : 'muted'}>{profile.active ? 'Active' : 'Inactive'}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">Today's attendance</p>
            {today === undefined ? (
              <Spinner />
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  {today ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone={today.status === 'PRESENT' ? 'teal' : 'rust'}>{today.status}</Badge>
                      <p className="text-xs text-muted">
                        by {today.markedByName} at {formatDateTime(today.markedAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Not marked yet today.</p>
                  )}
                </div>
                <PermissionGate any={[Permission.MARK_ATTENDANCE]}>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => markToday('PRESENT')} disabled={today?.status === 'PRESENT'}>
                      <Check size={14} /> Present today
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => markToday('ABSENT')} disabled={today?.status === 'ABSENT'}>
                      <X size={14} /> Absent today
                    </Button>
                  </div>
                </PermissionGate>
              </div>
            )}
          </Card>

          <Card>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">Monthly attendance</p>
            <AttendanceMonthGrid
              staffId={staffId}
              refreshKey={attendanceVersion}
              onMarked={(attendance) => {
                setToday(attendance)
                staffApi.salarySummary(staffId).then(setSalary)
              }}
            />
          </Card>

          <Card>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">Salary payment history</p>
            {!payments ? (
              <Spinner />
            ) : (
              <Table
                emptyMessage="No salary payments recorded yet."
                rows={payments}
                columns={[
                  { key: 'periodStart', header: 'Period', render: (r) => `${formatDate(r.periodStart)} → ${formatDate(r.periodEnd)}` },
                  { key: 'amountPaid', header: 'Amount', align: 'right', render: (r) => formatMoney(r.amountPaid) },
                  { key: 'paidByName', header: 'Paid by' },
                ]}
              />
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
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

            <div className="mt-4 flex flex-col gap-2">
              <PermissionGate any={[Permission.MANAGE_SALARY]}>
                <Button onClick={() => setPayModalOpen(true)}>
                  <IndianRupee size={16} /> Mark salary paid
                </Button>
              </PermissionGate>
              <PermissionGate any={[Permission.MANAGE_STAFF_HR]}>
                <Button variant="secondary" onClick={() => setSalaryModalOpen(true)}>
                  Update monthly salary
                </Button>
              </PermissionGate>
            </div>
          </Card>
        </div>
      </div>

      <UpdateSalaryModal
        open={salaryModalOpen}
        onClose={() => setSalaryModalOpen(false)}
        staffId={staffId}
        current={profile.monthlySalary}
        onSaved={() => {
          setSalaryModalOpen(false)
          loadAll()
        }}
      />
      <PaySalaryModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        staffId={staffId}
        amount={salary?.cumulativeSalary}
        onPaid={() => {
          setPayModalOpen(false)
          loadAll()
        }}
      />
    </div>
  )
}

function UpdateSalaryModal({ open, onClose, staffId, current, onSaved }) {
  const [value, setValue] = useState(current)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => setValue(current), [current])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await staffApi.updateSalary(staffId, Number(value))
      toast.success('Salary updated')
      onSaved()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Update monthly salary">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label="Monthly salary" type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} required />
        <p className="text-xs text-muted">Past attendance keeps its old per-day value — only future days use the new salary.</p>
        <Button type="submit" loading={saving}>
          Save
        </Button>
      </form>
    </Modal>
  )
}

function PaySalaryModal({ open, onClose, staffId, amount, onPaid }) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await staffApi.paySalary(staffId, notes)
      toast.success('Salary marked as paid')
      setNotes('')
      onPaid()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Mark salary as paid">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          This will record a payment of <span className="font-mono text-paper">{formatMoney(amount)}</span> and start the
          cumulative salary fresh from today.
        </p>
        <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button type="submit" loading={saving}>
          Confirm payment
        </Button>
      </form>
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { staffApi } from '../../api/staff'
import { apiErrorMessage } from '../../api/client'
import { formatDate, formatDateTime, todayIso } from '../../utils/format'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'

export default function StaffAttendancePage() {
  const [staff, setStaff] = useState(null)
  const [todayByStaff, setTodayByStaff] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const toast = useToast()

  const activeStaff = staff?.filter((person) => person.active) ?? []

  const loadStaff = () => {
    setStaff(null)
    staffApi.list().then(setStaff).catch((e) => toast.error(apiErrorMessage(e)))
  }

  const loadToday = (people = activeStaff) => {
    if (people.length === 0) {
      setTodayByStaff({})
      return
    }

    setTodayByStaff(null)
    Promise.all(
      people.map((person) =>
        staffApi
          .todayAttendance(person.staffProfileId)
          .then((attendance) => [person.staffProfileId, attendance])
          .catch(() => [person.staffProfileId, null]),
      ),
    ).then((entries) => setTodayByStaff(Object.fromEntries(entries)))
  }

  useEffect(() => {
    loadStaff()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (staff) loadToday(activeStaff)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff])

  const mark = async (person, status) => {
    setSavingId(person.staffProfileId)
    try {
      const attendance = await staffApi.markAttendance(person.staffProfileId, todayIso(), status)
      setTodayByStaff((current) => ({ ...(current || {}), [person.staffProfileId]: attendance }))
      toast.success(`${person.name} marked ${status === 'PRESENT' ? 'present' : 'absent'} for today`)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Staff"
        title="Staff attendance"
        description="Mark and correct today's attendance for the team."
        actions={
          <Button variant="secondary" onClick={() => loadToday()} disabled={!staff || todayByStaff === null}>
            Refresh
          </Button>
        }
      />

      <Card>
        <div className="mb-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Today</p>
          <p className="mt-1 text-sm text-muted">{formatDate(todayIso())}</p>
        </div>

        {!staff || todayByStaff === null ? (
          <Spinner />
        ) : (
          <Table
            keyField="staffProfileId"
            emptyMessage="No active staff to mark today."
            rows={activeStaff}
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (person) => (
                  <Link to={`/staff/${person.staffProfileId}`} className="font-medium text-paper hover:text-amber">
                    {person.name}
                  </Link>
                ),
              },
              {
                key: 'todayStatus',
                header: 'Today',
                render: (person) => {
                  const attendance = todayByStaff[person.staffProfileId]
                  if (!attendance) return <Badge>Not marked</Badge>
                  return (
                    <Badge tone={attendance.status === 'PRESENT' ? 'teal' : 'rust'}>
                      {attendance.status === 'PRESENT' ? 'Present' : 'Absent'}
                    </Badge>
                  )
                },
              },
              {
                key: 'markedBy',
                header: 'Marked by',
                render: (person) => {
                  const attendance = todayByStaff[person.staffProfileId]
                  return attendance ? `${attendance.markedByName} · ${formatDateTime(attendance.markedAt)}` : '-'
                },
              },
              {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                render: (person) => {
                  const attendance = todayByStaff[person.staffProfileId]
                  const saving = savingId === person.staffProfileId
                  return (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => mark(person, 'PRESENT')}
                        loading={saving}
                        disabled={attendance?.status === 'PRESENT'}
                      >
                        <Check size={14} /> Present
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => mark(person, 'ABSENT')}
                        loading={saving}
                        disabled={attendance?.status === 'ABSENT'}
                      >
                        <X size={14} /> Absent
                      </Button>
                    </div>
                  )
                },
              },
            ]}
          />
        )}
      </Card>
    </div>
  )
}

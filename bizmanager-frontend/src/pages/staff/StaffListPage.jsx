import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { staffApi } from '../../api/staff'
import { rolesApi } from '../../api/roles'
import { apiErrorMessage } from '../../api/client'
import { formatMoney, formatDate } from '../../utils/format'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import PermissionGate from '../../components/layout/PermissionGate'
import { Permission } from '../../utils/permissions'

export default function StaffListPage() {
  const [staff, setStaff] = useState(null)
  const [salaryByStaff, setSalaryByStaff] = useState(null)
  const [creating, setCreating] = useState(false)
  const toast = useToast()

  const load = () => staffApi.list().then(setStaff).catch((e) => toast.error(apiErrorMessage(e)))
  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!staff) return
    if (staff.length === 0) {
      setSalaryByStaff({})
      return
    }

    setSalaryByStaff(null)
    Promise.all(
      staff.map((person) =>
        staffApi
          .salarySummary(person.staffProfileId)
          .then((summary) => [person.staffProfileId, summary])
          .catch(() => [person.staffProfileId, null]),
      ),
    ).then((entries) => setSalaryByStaff(Object.fromEntries(entries)))
  }, [staff])

  return (
    <div>
      <PageHeader
        eyebrow="Staff"
        title="Staff"
        description="Profiles, attendance, and salary."
        actions={
          <PermissionGate any={[Permission.MANAGE_STAFF_HR]}>
            <Button onClick={() => setCreating(true)}>
              <UserPlus size={16} /> Add staff
            </Button>
          </PermissionGate>
        }
      />

      {!staff ? (
        <Spinner />
      ) : (
        <Table
          emptyMessage="No staff added yet."
          rows={staff}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r) => (
                <Link to={`/staff/${r.staffProfileId}`} className="font-medium text-paper hover:text-amber">
                  {r.name}
                </Link>
              ),
            },
            { key: 'phone', header: 'Phone' },
            { key: 'roleName', header: 'Role', render: (r) => <Badge>{r.roleName || 'Staff'}</Badge> },
            { key: 'monthlySalary', header: 'Monthly salary', align: 'right', render: (r) => formatMoney(r.monthlySalary) },
            {
              key: 'accruedSalary',
              header: 'Accrued salary',
              align: 'right',
              render: (r) => {
                const summary = salaryByStaff?.[r.staffProfileId]
                if (salaryByStaff === null) return <span className="text-muted">Loading...</span>
                if (!summary) return <span className="text-muted">-</span>
                return (
                  <div>
                    <p className="font-mono text-paper">{formatMoney(summary.cumulativeSalary)}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {summary.presentDaysSincePaid} present · {summary.absentDaysSincePaid} absent
                    </p>
                  </div>
                )
              },
            },
            { key: 'joiningDate', header: 'Joined', render: (r) => formatDate(r.joiningDate) },
            {
              key: 'active',
              header: 'Status',
              render: (r) => <Badge tone={r.active ? 'teal' : 'muted'}>{r.active ? 'Active' : 'Inactive'}</Badge>,
            },
          ]}
        />
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Add staff">
        <CreateStaffForm
          onDone={() => {
            setCreating(false)
            load()
          }}
        />
      </Modal>
    </div>
  )
}

function CreateStaffForm({ onDone }) {
  const [roles, setRoles] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', password: '', roleId: '', monthlySalary: '', joiningDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  useEffect(() => {
    rolesApi.listAssignable().then((data) => {
      setRoles(data)
      const staffRole = data.find((role) => role.name === 'Staff') || data[0]
      if (staffRole) setForm((current) => ({ ...current, roleId: String(staffRole.id) }))
    }).catch((err) => setError(apiErrorMessage(err)))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await staffApi.create({ ...form, roleId: Number(form.roleId), monthlySalary: Number(form.monthlySalary) })
      toast.success(`${form.name} added`)
      onDone()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!roles) return <Spinner />

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label="Name" value={form.name} onChange={update('name')} required />
      <Input label="Phone" type="tel" value={form.phone} onChange={update('phone')} required />
      <Input label="Password" type="password" minLength={6} value={form.password} onChange={update('password')} required />
      <Select label="Role" value={form.roleId} onChange={update('roleId')} required>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </Select>
      <Input label="Monthly salary" type="number" min="0" value={form.monthlySalary} onChange={update('monthlySalary')} required />
      <Input label="Joining date" type="date" value={form.joiningDate} onChange={update('joiningDate')} required />
      {error && <p className="text-sm text-rust">{error}</p>}
      <Button type="submit" loading={saving}>
        Add staff
      </Button>
    </form>
  )
}

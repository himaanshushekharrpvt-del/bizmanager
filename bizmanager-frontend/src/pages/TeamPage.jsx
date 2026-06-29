import { useEffect, useState } from 'react'
import { UserPlus, ShieldPlus, Trash2, KeyRound } from 'lucide-react'
import { usersApi } from '../api/users'
import { rolesApi } from '../api/roles'
import { apiErrorMessage } from '../api/client'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { Permission, PERMISSION_LABELS, ALL_PERMISSIONS } from '../utils/permissions'
import PageHeader from '../components/ui/PageHeader'
import Tabs from '../components/ui/Tabs'
import Table from '../components/ui/Table'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import PermissionGate from '../components/layout/PermissionGate'

export default function TeamPage() {
  const [tab, setTab] = useState('users')
  return (
    <div>
      <PageHeader eyebrow="Team" title="Team & roles" description="Who can log in, and what they can do." />
      <Tabs
        tabs={[
          { key: 'users', label: 'Users' },
          { key: 'roles', label: 'Roles' },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div className="mt-6">{tab === 'users' ? <UsersTab /> : <RolesTab />}</div>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState(null)
  const [modal, setModal] = useState(null) // 'admin' | 'staff' | null
  const [resetTarget, setResetTarget] = useState(null)
  const toast = useToast()
  const { user: me } = useAuth()

  const load = () => usersApi.list().then(setUsers).catch((e) => toast.error(apiErrorMessage(e)))
  useEffect(() => {
    load()
  }, [])

  const deactivate = async (u) => {
    try {
      await usersApi.deactivate(u.id)
      load()
      toast.success(`${u.name} deactivated`)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <PermissionGate any={[Permission.MANAGE_ADMINS]}>
          <Button variant="secondary" onClick={() => setModal('admin')}>
            <ShieldPlus size={16} /> Add admin
          </Button>
        </PermissionGate>
        <PermissionGate any={[Permission.MANAGE_STAFF_ACCOUNTS]}>
          <Button onClick={() => setModal('staff')}>
            <UserPlus size={16} /> Add staff account
          </Button>
        </PermissionGate>
      </div>

      {!users ? (
        <Spinner />
      ) : (
        <Table
          emptyMessage="No users yet."
          rows={users}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'phone', header: 'Phone' },
            { key: 'roleName', header: 'Role' },
            { key: 'active', header: 'Status', render: (r) => <Badge tone={r.active ? 'teal' : 'muted'}>{r.active ? 'Active' : 'Inactive'}</Badge> },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (r) =>
                r.id !== me.userId && (
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setResetTarget(r)} className="text-muted hover:text-amber" aria-label="Reset password">
                      <KeyRound size={16} />
                    </button>
                    {r.active && (
                      <button onClick={() => deactivate(r)} className="text-muted hover:text-rust" aria-label="Deactivate">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ),
            },
          ]}
        />
      )}

      <Modal open={modal === 'admin'} onClose={() => setModal(null)} title="Add admin">
        <CreateAdminForm onDone={() => { setModal(null); load() }} />
      </Modal>
      <Modal open={modal === 'staff'} onClose={() => setModal(null)} title="Add staff account">
        <CreateStaffAccountForm onDone={() => { setModal(null); load() }} />
      </Modal>
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset password · ${resetTarget?.name}`}>
        {resetTarget && <ResetPasswordForm user={resetTarget} onDone={() => setResetTarget(null)} />}
      </Modal>
    </div>
  )
}

function CreateAdminForm({ onDone }) {
  const [form, setForm] = useState({ name: '', phone: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()
  const update = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await usersApi.createAdmin(form)
      toast.success(`${form.name} added as Admin`)
      onDone()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label="Name" value={form.name} onChange={update('name')} required />
      <Input label="Phone" type="tel" value={form.phone} onChange={update('phone')} required />
      <Input label="Password" type="password" minLength={6} value={form.password} onChange={update('password')} required />
      {error && <p className="text-sm text-rust">{error}</p>}
      <Button type="submit" loading={saving}>
        Add admin
      </Button>
    </form>
  )
}

function CreateStaffAccountForm({ onDone }) {
  const [roles, setRoles] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', password: '', roleId: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()
  const update = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }))

  useEffect(() => {
    rolesApi.listAssignable().then((data) => {
      setRoles(data)
      if (data.length > 0) setForm((s) => ({ ...s, roleId: String(data[0].id) }))
    })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await usersApi.createStaffAccount({ ...form, roleId: Number(form.roleId) })
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
      <Select label="Role" value={form.roleId} onChange={update('roleId')}>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </Select>
      <p className="text-xs text-muted">
        For a StockManager-type role, this account will only ever see item names — never cost or selling prices.
      </p>
      {error && <p className="text-sm text-rust">{error}</p>}
      <Button type="submit" loading={saving}>
        Add account
      </Button>
    </form>
  )
}

function ResetPasswordForm({ user, onDone }) {
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await usersApi.resetPassword(user.id, password)
      toast.success(`Password reset for ${user.name}`)
      onDone()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label="New password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
      <Button type="submit" loading={saving}>
        Reset password
      </Button>
    </form>
  )
}

function RolesTab() {
  const [roles, setRoles] = useState(null)
  const [creating, setCreating] = useState(false)
  const toast = useToast()

  const load = () => rolesApi.list().then(setRoles).catch((e) => toast.error(apiErrorMessage(e)))
  useEffect(() => {
    load()
  }, [])

  const remove = async (role) => {
    try {
      await rolesApi.remove(role.id)
      load()
      toast.success(`"${role.name}" deleted`)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  if (!roles) return <Spinner />

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <PermissionGate any={[Permission.MANAGE_ROLES]}>
          <Button onClick={() => setCreating(true)}>
            <ShieldPlus size={16} /> Create role
          </Button>
        </PermissionGate>
      </div>

      <div className="flex flex-col gap-3">
        {roles.map((role) => (
          <div key={role.id} className="rounded-xl border border-line bg-ink-2 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium text-paper">{role.name}</p>
                {role.systemDefault && <Badge tone="indigo">Default</Badge>}
                {role.masterAdminRole && <Badge tone="amber">MasterAdmin</Badge>}
              </div>
              <PermissionGate any={[Permission.MANAGE_ROLES]}>
                {!role.systemDefault && (
                  <button onClick={() => remove(role)} className="text-muted hover:text-rust" aria-label="Delete role">
                    <Trash2 size={16} />
                  </button>
                )}
              </PermissionGate>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {role.permissions.length === 0 ? (
                <span className="text-xs text-muted">No permissions (self-service only)</span>
              ) : (
                role.permissions.map((p) => (
                  <span key={p} className="rounded-full bg-ink-3 px-2 py-0.5 text-[11px] text-muted">
                    {PERMISSION_LABELS[p] || p}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Create role">
        <CreateRoleForm onDone={() => { setCreating(false); load() }} />
      </Modal>
    </div>
  )
}

function CreateRoleForm({ onDone }) {
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()

  const toggle = (perm) => {
    setPermissions((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]))
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await rolesApi.create({ name, permissions })
      toast.success(`Role "${name}" created`)
      onDone()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label="Role name" value={name} onChange={(e) => setName(e.target.value)} required />
      <div>
        <p className="mb-2 text-sm font-medium text-paper">Permissions</p>
        <div className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-lg border border-line p-3">
          {ALL_PERMISSIONS.map((perm) => (
            <label key={perm} className="flex items-center gap-2 text-sm text-paper">
              <input type="checkbox" checked={permissions.includes(perm)} onChange={() => toggle(perm)} className="accent-amber" />
              {PERMISSION_LABELS[perm]}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-rust">{error}</p>}
      <Button type="submit" loading={saving}>
        Create role
      </Button>
    </form>
  )
}

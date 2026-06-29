import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Ticket,
  Receipt,
  Users,
  CalendarCheck,
  UserCircle,
  Package,
  Shield,
  Bell,
  BarChart3,
  ScrollText,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { Permission } from '../../utils/permissions'

function useNavItems() {
  const { user, hasPermission, hasAnyPermission } = useAuth()
  if (!user) return []

  return [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, show: hasPermission(Permission.VIEW_REPORTS) },
    {
      label: 'Tickets',
      path: '/tickets',
      icon: Ticket,
      show: hasAnyPermission([Permission.MANAGE_TICKETS, Permission.MANAGE_RIBBONS, Permission.ENTER_TICKET_SALES]),
    },
    {
      label: 'Expenses',
      path: '/expenses',
      icon: Receipt,
      show: hasAnyPermission([Permission.MANAGE_EXPENSE_ITEMS, Permission.ENTER_DAILY_EXPENSE]),
    },
    {
      label: 'Staff',
      path: '/staff',
      icon: Users,
      show: hasAnyPermission([Permission.MANAGE_STAFF_HR, Permission.MARK_ATTENDANCE, Permission.MANAGE_SALARY]),
    },
    {
      label: 'Staff attendance',
      path: '/staff/attendance',
      icon: CalendarCheck,
      show: hasPermission(Permission.MARK_ATTENDANCE),
      child: true,
    },
    { label: 'My profile', path: '/my-profile', icon: UserCircle, show: !user.adminLevel },
    {
      label: 'Stock',
      path: '/stock',
      icon: Package,
      show: hasAnyPermission([Permission.MANAGE_STOCK_ITEMS, Permission.ENTER_STOCK_SALE]),
    },
    {
      label: 'Team',
      path: '/team',
      icon: Shield,
      show: hasAnyPermission([Permission.MANAGE_ADMINS, Permission.MANAGE_ROLES, Permission.MANAGE_STAFF_ACCOUNTS]),
    },
    { label: 'Alerts', path: '/alerts', icon: Bell, show: user.adminLevel },
    { label: 'Analytics', path: '/analytics', icon: BarChart3, show: hasPermission(Permission.VIEW_REPORTS) },
    { label: 'Audit log', path: '/audit-log', icon: ScrollText, show: hasPermission(Permission.VIEW_AUDIT_LOG) },
  ].filter((item) => item.show)
}

function NavLinks({ items, onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              item.child && 'ml-6 py-2 text-xs',
              isActive ? 'bg-amber-dim text-amber' : 'text-muted hover:bg-ink-3 hover:text-paper',
            )
          }
        >
          <item.icon size={item.child ? 16 : 18} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const items = useNavItems()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-ink">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-none flex-col border-r border-line bg-ink-2 md:flex">
        <BrandHeader businessName={user?.businessName} />
        <NavLinks items={items} />
        <UserFooter user={user} onLogout={logout} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-ink-2 shadow-2xl">
            <div className="flex items-center justify-between px-4 pt-4">
              <BrandHeader businessName={user?.businessName} compact />
              <button onClick={() => setDrawerOpen(false)} className="text-muted hover:text-paper">
                <X size={20} />
              </button>
            </div>
            <NavLinks items={items} onNavigate={() => setDrawerOpen(false)} />
            <UserFooter user={user} onLogout={logout} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-ink-2 px-4 py-3 md:hidden">
          <span className="font-display text-lg font-semibold text-paper">BizManager</span>
          <button onClick={() => setDrawerOpen(true)} className="text-paper" aria-label="Open menu">
            <Menu size={22} />
          </button>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function BrandHeader({ businessName, compact }) {
  return (
    <div className={clsx('px-5', compact ? 'py-0' : 'py-5')}>
      <p className="font-display text-lg font-semibold text-paper">BizManager</p>
      {businessName && <p className="mt-0.5 truncate text-xs text-muted">{businessName}</p>}
    </div>
  )
}

function UserFooter({ user, onLogout }) {
  if (!user) return null
  return (
    <div className="flex items-center gap-3 border-t border-line px-4 py-4">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-dim font-display text-sm font-semibold text-amber">
        {user.name?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-paper">{user.name}</p>
        <p className="truncate text-xs text-muted">{user.roleName}</p>
      </div>
      <button onClick={onLogout} className="flex-none text-muted hover:text-rust" aria-label="Log out" title="Log out">
        <LogOut size={18} />
      </button>
    </div>
  )
}

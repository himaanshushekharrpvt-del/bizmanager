import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Permission } from './utils/permissions'

import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import RequirePermission from './components/layout/RequirePermission'
import Spinner from './components/ui/Spinner'

import LoginPage from './pages/auth/LoginPage'
import RegisterBusinessPage from './pages/auth/RegisterBusinessPage'
import DashboardPage from './pages/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'

// Lazy-loaded: these pull in heavier per-page code (recharts, calendar grids, etc.)
// that most sessions won't touch on every visit - keeps the initial bundle lean,
// which matters most on mobile connections.
const TicketsPage = lazy(() => import('./pages/TicketsPage'))
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'))
const StaffListPage = lazy(() => import('./pages/staff/StaffListPage'))
const StaffAttendancePage = lazy(() => import('./pages/staff/StaffAttendancePage'))
const StaffDetailPage = lazy(() => import('./pages/staff/StaffDetailPage'))
const MyProfilePage = lazy(() => import('./pages/staff/MyProfilePage'))
const StockPage = lazy(() => import('./pages/StockPage'))
const TeamPage = lazy(() => import('./pages/TeamPage'))
const AlertsPage = lazy(() => import('./pages/AlertsPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'))

function LazyPage({ children }) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterBusinessPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRoute />} />

        <Route
          path="/tickets"
          element={
            <RequirePermission any={[Permission.MANAGE_TICKETS, Permission.MANAGE_RIBBONS, Permission.ENTER_TICKET_SALES]}>
              <LazyPage><TicketsPage /></LazyPage>
            </RequirePermission>
          }
        />
        <Route
          path="/expenses"
          element={
            <RequirePermission any={[Permission.MANAGE_EXPENSE_ITEMS, Permission.ENTER_DAILY_EXPENSE]}>
              <LazyPage><ExpensesPage /></LazyPage>
            </RequirePermission>
          }
        />
        <Route
          path="/staff"
          element={
            <RequirePermission any={[Permission.MANAGE_STAFF_HR, Permission.MARK_ATTENDANCE, Permission.MANAGE_SALARY]}>
              <LazyPage><StaffListPage /></LazyPage>
            </RequirePermission>
          }
        />
        <Route
          path="/staff/attendance"
          element={
            <RequirePermission any={[Permission.MARK_ATTENDANCE]}>
              <LazyPage><StaffAttendancePage /></LazyPage>
            </RequirePermission>
          }
        />
        <Route
          path="/staff/:id"
          element={
            <RequirePermission any={[Permission.MANAGE_STAFF_HR, Permission.MARK_ATTENDANCE, Permission.MANAGE_SALARY]}>
              <LazyPage><StaffDetailPage /></LazyPage>
            </RequirePermission>
          }
        />
        <Route path="/my-profile" element={<LazyPage><MyProfilePage /></LazyPage>} />
        <Route
          path="/stock"
          element={
            <RequirePermission any={[Permission.MANAGE_STOCK_ITEMS, Permission.ENTER_STOCK_SALE]}>
              <LazyPage><StockPage /></LazyPage>
            </RequirePermission>
          }
        />
        <Route
          path="/team"
          element={
            <RequirePermission any={[Permission.MANAGE_ADMINS, Permission.MANAGE_ROLES, Permission.MANAGE_STAFF_ACCOUNTS]}>
              <LazyPage><TeamPage /></LazyPage>
            </RequirePermission>
          }
        />
        <Route path="/alerts" element={<LazyPage><AlertsPage /></LazyPage>} />
        <Route
          path="/analytics"
          element={
            <RequirePermission any={[Permission.VIEW_REPORTS]}>
              <LazyPage><AnalyticsPage /></LazyPage>
            </RequirePermission>
          }
        />
        <Route
          path="/audit-log"
          element={
            <RequirePermission any={[Permission.VIEW_AUDIT_LOG]}>
              <LazyPage><AuditLogPage /></LazyPage>
            </RequirePermission>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

/** Lands each role somewhere useful: Admin/MasterAdmin → dashboard, StockManager → stock, Staff → their profile. */
function HomeRoute() {
  const { hasPermission } = useAuth()
  if (hasPermission(Permission.VIEW_REPORTS)) return <DashboardPage />
  if (hasPermission(Permission.ENTER_STOCK_SALE)) return <Navigate to="/stock" replace />
  return <Navigate to="/my-profile" replace />
}

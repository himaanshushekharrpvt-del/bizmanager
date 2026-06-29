import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, ShoppingBag, Receipt, Wallet, Users, AlertTriangle } from 'lucide-react'
import { analyticsApi } from '../api/analytics'
import { apiErrorMessage } from '../api/client'
import { formatMoney, formatDate } from '../utils/format'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi
      .dashboard()
      .then(setData)
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (error) return <EmptyState message={error} />
  if (!data) return null

  const netPositive = Number(data.revenueAfterExpensesToday) >= 0

  return (
    <div>
      <PageHeader eyebrow={formatDate(data.date)} title="Today's tally" description="Closing numbers for today, updated live as entries come in." />

      {data.activeAlertsCount > 0 && (
        <Link
          to="/alerts"
          className="mb-6 flex items-center gap-3 rounded-xl border border-rust/40 bg-rust-dim px-4 py-3 text-sm text-rust hover:bg-rust-dim/80"
        >
          <AlertTriangle size={18} className="flex-none" />
          {data.activeAlertsCount} active alert{data.activeAlertsCount > 1 ? 's' : ''} need attention — view alerts →
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Ticket revenue"
          value={formatMoney(data.ticketRevenueToday)}
          sublabel={`${data.adultSoldToday} adult · ${data.childSoldToday} child`}
          icon={TrendingUp}
          tone="amber"
        />
        <StatCard
          label="Stock revenue"
          value={formatMoney(data.stockRevenueToday)}
          sublabel={data.topSellingItemToday ? `Top seller: ${data.topSellingItemToday.itemName}` : 'No sales logged yet'}
          icon={ShoppingBag}
          tone="teal"
        />
        <StatCard label="Expenses" value={formatMoney(data.expensesToday)} sublabel="Logged today" icon={Receipt} tone="rust" />
        <StatCard
          label="Revenue after expenses"
          value={formatMoney(data.revenueAfterExpensesToday)}
          sublabel="Tickets + stock − expenses"
          icon={Wallet}
          tone={netPositive ? 'teal' : 'rust'}
        />
        <StatCard
          label="Staff today"
          value={`${data.staffPresentToday} present`}
          sublabel={`${data.staffAbsentToday} absent`}
          icon={Users}
          tone="paper"
        />
        <StatCard
          label="Alerts"
          value={data.activeAlertsCount}
          sublabel={data.activeAlertsCount > 0 ? 'Needs attention' : 'All clear'}
          icon={AlertTriangle}
          tone={data.activeAlertsCount > 0 ? 'rust' : 'teal'}
        />
      </div>

      <Card className="mt-6">
        <p className="text-sm text-muted">
          Want a longer view? Head to <Link to="/analytics" className="text-amber hover:underline">Analytics</Link> for any
          date range — daily, weekly, monthly, yearly, or custom.
        </p>
      </Card>
    </div>
  )
}

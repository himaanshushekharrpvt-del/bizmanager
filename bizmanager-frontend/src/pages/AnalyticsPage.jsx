import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { analyticsApi } from '../api/analytics'
import { ticketsApi } from '../api/tickets'
import { apiErrorMessage } from '../api/client'
import { formatMoney, formatDate } from '../utils/format'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Tabs from '../components/ui/Tabs'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Spinner from '../components/ui/Spinner'
import DateRangeBar from '../components/ui/DateRangeBar'
import { rangeForPreset } from '../utils/dateRanges'

export default function AnalyticsPage() {
  const [tab, setTab] = useState('revenue')
  const [range, setRange] = useState(rangeForPreset('month'))

  return (
    <div>
      <PageHeader eyebrow="Analytics" title="Revenue & insights" description="Daily, weekly, monthly, yearly, or any custom range." />
      <Tabs
        tabs={[
          { key: 'revenue', label: 'Revenue' },
          { key: 'insights', label: 'Insights' },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div className="mt-6 flex flex-col gap-6">
        <DateRangeBar from={range.from} to={range.to} onChange={setRange} />
        {tab === 'revenue' ? <RevenueTab range={range} /> : <InsightsTab range={range} />}
      </div>
    </div>
  )
}

function RevenueTab({ range }) {
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState(null)
  const [included, setIncluded] = useState({
    ticketRevenue: true,
    stockProfit: true,
    expenses: true,
    staffCost: true,
  })
  const toast = useToast()

  useEffect(() => {
    analyticsApi
      .revenue(range.from, range.to)
      .then(setSummary)
      .catch((e) => toast.error(apiErrorMessage(e)))
    ticketsApi
      .listSales(range.from, range.to)
      .then((sales) => setTrend(sales.map((s) => ({ date: formatDate(s.saleDate), revenue: Number(s.totalRevenue) }))))
      .catch(() => setTrend([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  if (!summary) return <Spinner />

  const calculationParts = [
    { key: 'ticketRevenue', amount: Number(summary.ticketRevenue) },
    { key: 'stockProfit', amount: Number(summary.stockProfit) },
    { key: 'expenses', amount: -Number(summary.totalExpenses) },
    { key: 'staffCost', amount: -Number(summary.staffCost) },
  ]
  const calculatedNetProfit = calculationParts.reduce(
    (total, part) => total + (included[part.key] ? part.amount : 0),
    0,
  )
  const netPositive = calculatedNetProfit >= 0
  const toggleIncluded = (key) => setIncluded((current) => ({ ...current, [key]: !current[key] }))

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Ticket revenue"
          value={formatMoney(summary.ticketRevenue)}
          sub={`${summary.adultTicketsSold} adult · ${summary.childTicketsSold} child`}
          included={included.ticketRevenue}
          onToggle={() => toggleIncluded('ticketRevenue')}
        />
        <Metric
          label="Stock sales"
          value={formatMoney(summary.stockRevenue)}
          sub={`profit ${formatMoney(summary.stockProfit)}`}
          included={included.stockProfit}
          onToggle={() => toggleIncluded('stockProfit')}
        />
        <Metric
          label="Expenses"
          value={formatMoney(summary.totalExpenses)}
          included={included.expenses}
          onToggle={() => toggleIncluded('expenses')}
        />
        <Metric
          label="Staff cost"
          value={formatMoney(summary.staffCost)}
          sub="present-day pay"
          included={included.staffCost}
          onToggle={() => toggleIncluded('staffCost')}
        />
      </div>

      <Card className="border-amber/30">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-muted">Ticket revenue + stock profit</p>
          <p className="font-mono text-xl text-paper">
            {formatMoney((included.ticketRevenue ? Number(summary.ticketRevenue) : 0) + (included.stockProfit ? Number(summary.stockProfit) : 0))}
          </p>
        </div>
        <div className="my-2 border-t border-line" />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-muted">Net profit</p>
          <p className={`font-mono text-2xl ${netPositive ? 'text-teal' : 'text-rust'}`}>
            {formatMoney(calculatedNetProfit)}
          </p>
        </div>
      </Card>

      {trend && trend.length > 1 && (
        <Card>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">Ticket revenue trend</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333b47" />
                <XAxis dataKey="date" stroke="#8b92a0" fontSize={11} tickLine={false} />
                <YAxis stroke="#8b92a0" fontSize={11} tickLine={false} width={70} tickFormatter={(v) => formatMoney(v)} />
                <Tooltip
                  contentStyle={{ background: '#1e232b', border: '1px solid #333b47', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#edeae2' }}
                  formatter={(value) => [formatMoney(value), 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#e8a33d" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  )
}

function Metric({ label, value, sub, included = true, onToggle }) {
  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={included}
        className={`rounded-2xl border bg-ink-2 p-4 text-left transition-colors sm:p-5 ${
          included ? 'border-amber/50 ring-1 ring-amber/20' : 'border-line opacity-70 hover:opacity-100'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${included ? 'border-amber/30 bg-amber-dim text-amber' : 'border-line bg-ink-3 text-muted'}`}>
            {included ? 'Included' : 'Excluded'}
          </span>
        </div>
        <p className="mt-1 font-mono text-xl text-paper">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      </button>
    )
  }

  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-mono text-xl text-paper">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </Card>
  )
}

function InsightsTab({ range }) {
  const [insights, setInsights] = useState(null)
  const toast = useToast()

  useEffect(() => {
    analyticsApi
      .insights(range.from, range.to)
      .then(setInsights)
      .catch((e) => toast.error(apiErrorMessage(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  if (!insights) return <Spinner />

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">Best-selling items</p>
        <Table
          emptyMessage="No stock sales in this range."
          rows={insights.bestSellingItems}
          keyField="itemId"
          columns={[
            { key: 'itemName', header: 'Item' },
            { key: 'totalQuantitySold', header: 'Units', align: 'right' },
            { key: 'totalRevenue', header: 'Revenue', align: 'right', render: (r) => formatMoney(r.totalRevenue) },
          ]}
        />
      </Card>

      <Card>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">Expense breakdown</p>
        <Table
          emptyMessage="No expenses in this range."
          rows={insights.expenseBreakdown}
          keyField="itemName"
          columns={[
            { key: 'itemName', header: 'Category' },
            { key: 'total', header: 'Total', align: 'right', render: (r) => formatMoney(r.total) },
          ]}
        />
      </Card>

      <Card>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">Tickets</p>
        <dl className="flex flex-col gap-2 text-sm">
          <Row label="Adult tickets" value={insights.totalAdultTickets} />
          <Row label="Child tickets" value={insights.totalChildTickets} />
          <Row label="Average daily ticket revenue" value={formatMoney(insights.averageDailyTicketRevenue)} />
        </dl>
      </Card>

      <Card>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">Busiest / slowest day</p>
        <dl className="flex flex-col gap-2 text-sm">
          <Row
            label="Busiest"
            value={insights.busiestTicketDay ? `${formatDate(insights.busiestTicketDay.date)} — ${formatMoney(insights.busiestTicketDay.revenue)}` : '—'}
          />
          <Row
            label="Slowest"
            value={insights.slowestTicketDay ? `${formatDate(insights.slowestTicketDay.date)} — ${formatMoney(insights.slowestTicketDay.revenue)}` : '—'}
          />
        </dl>
      </Card>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-line/60 pb-2 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono text-paper">{value}</dd>
    </div>
  )
}

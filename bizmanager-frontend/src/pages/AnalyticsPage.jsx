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
  const [revenueSources, setRevenueSources] = useState({
    ticketRevenue: true,
    stockRevenue: true,
  })
  const [deductions, setDeductions] = useState({
    stockCost: true,
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

  const ticketRevenue = Number(summary.ticketRevenue)
  const stockRevenue = Number(summary.stockRevenue)
  const stockProfit = Number(summary.stockProfit)
  const stockCost = Number(summary.stockCost ?? Math.max(stockRevenue - stockProfit, 0))
  const expenses = Number(summary.totalExpenses)
  const staffCost = Number(summary.staffCost)
  const grossRevenue = Number(summary.grossRevenue ?? ticketRevenue + stockRevenue)
  const grossProfitBeforeOperatingCosts = Number(
    summary.grossProfitBeforeOperatingCosts ?? ticketRevenue + stockProfit,
  )
  const selectedRevenue =
    (revenueSources.ticketRevenue ? ticketRevenue : 0) +
    (revenueSources.stockRevenue ? stockRevenue : 0)
  const selectedDeductions =
    (deductions.stockCost && revenueSources.stockRevenue ? stockCost : 0) +
    (deductions.expenses ? expenses : 0) +
    (deductions.staffCost ? staffCost : 0)
  const netResult = selectedRevenue - selectedDeductions
  const netPositive = netResult >= 0
  const stockMargin = stockRevenue > 0 ? Math.round((stockProfit * 10000) / stockRevenue) / 100 : 0
  const toggleRevenueSource = (key) => setRevenueSources((current) => ({ ...current, [key]: !current[key] }))
  const toggleDeduction = (key) => setDeductions((current) => ({ ...current, [key]: !current[key] }))

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryMetric
          label="Ticket revenue"
          value={formatMoney(summary.ticketRevenue)}
          sub={`${summary.adultTicketsSold} adult · ${summary.childTicketsSold} child`}
        />
        <SummaryMetric
          label="Stock sales revenue"
          value={formatMoney(summary.stockRevenue)}
          sub={`gross sales from stock`}
        />
        <SummaryMetric
          label="Stock gross profit"
          value={formatMoney(summary.stockProfit)}
          sub={`after ${formatMoney(stockCost)} item cost · ${stockMargin}% margin`}
        />
        <SummaryMetric
          label="Gross revenue"
          value={formatMoney(grossRevenue)}
          sub="tickets + stock sales"
        />
      </div>

      <Card className="border-amber/30">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Profit / loss calculator</p>
              <p className="mt-1 text-sm text-muted">Choose revenue sources, then choose which costs to subtract.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Selected revenue</p>
              <p className="font-mono text-xl text-paper">{formatMoney(selectedRevenue)}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">Revenue included</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <ChoiceToggle
                label="Ticket revenue"
                value={formatMoney(summary.ticketRevenue)}
                description={`${summary.adultTicketsSold} adult tickets · ${summary.childTicketsSold} child tickets`}
                active={revenueSources.ticketRevenue}
                activeLabel="Included"
                inactiveLabel="Ignored"
                onClick={() => toggleRevenueSource('ticketRevenue')}
              />
              <ChoiceToggle
                label="Stock sales revenue"
                value={formatMoney(summary.stockRevenue)}
                description={`Gross stock sales. Profit before other costs is ${formatMoney(summary.stockProfit)}.`}
                active={revenueSources.stockRevenue}
                activeLabel="Included"
                inactiveLabel="Ignored"
                onClick={() => toggleRevenueSource('stockRevenue')}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">Costs subtracted</p>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <ChoiceToggle
                label="Stock item cost"
                value={formatMoney(stockCost)}
                description="Subtract purchase cost so stock sales become stock profit."
                active={deductions.stockCost && revenueSources.stockRevenue}
                activeLabel="Subtract"
                inactiveLabel={revenueSources.stockRevenue ? 'Ignore' : 'Stock off'}
                disabled={!revenueSources.stockRevenue}
                tone="cost"
                onClick={() => toggleDeduction('stockCost')}
              />
              <ChoiceToggle
                label="Expenses"
                value={formatMoney(summary.totalExpenses)}
                description="Daily expense entries in this range."
                active={deductions.expenses}
                activeLabel="Subtract"
                inactiveLabel="Ignore"
                tone="cost"
                onClick={() => toggleDeduction('expenses')}
              />
              <ChoiceToggle
                label="Staff cost"
                value={formatMoney(summary.staffCost)}
                description="Present-day salary cost in this range."
                active={deductions.staffCost}
                activeLabel="Subtract"
                inactiveLabel="Ignore"
                tone="cost"
                onClick={() => toggleDeduction('staffCost')}
              />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-ink/40 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-muted">Selected revenue</p>
              <p className="font-mono text-lg text-paper">{formatMoney(selectedRevenue)}</p>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-muted">Selected deductions</p>
              <p className="font-mono text-lg text-paper">-{formatMoney(selectedDeductions)}</p>
            </div>
            <div className="my-3 border-t border-line" />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-muted">Formula</p>
              <p className="text-right text-xs text-muted">selected revenue - selected costs</p>
            </div>
            <div className="my-3 border-t border-line" />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-muted">Net profit / loss</p>
              <p className={`font-mono text-2xl ${netPositive ? 'text-teal' : 'text-rust'}`}>
                {formatMoney(netResult)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">Quick breakdown</p>
        <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <BreakdownRow label="Ticket revenue" value={formatMoney(summary.ticketRevenue)} />
          <BreakdownRow label="Stock revenue" value={formatMoney(summary.stockRevenue)} />
          <BreakdownRow label="Stock item cost" value={`-${formatMoney(stockCost)}`} />
          <BreakdownRow label="Stock gross profit" value={formatMoney(summary.stockProfit)} positive />
          <BreakdownRow label="Profit before expenses" value={formatMoney(grossProfitBeforeOperatingCosts)} positive />
          <BreakdownRow label="Expenses" value={`-${formatMoney(summary.totalExpenses)}`} />
          <BreakdownRow label="Staff cost" value={`-${formatMoney(summary.staffCost)}`} />
        </dl>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryMetric
          label="Expenses"
          value={formatMoney(summary.totalExpenses)}
          sub="business expenses"
        />
        <SummaryMetric
          label="Staff cost"
          value={formatMoney(summary.staffCost)}
          sub="present-day pay"
        />
      </div>

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

function SummaryMetric({ label, value, sub }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-mono text-xl text-paper">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </Card>
  )
}

function ChoiceToggle({
  label,
  value,
  description,
  active,
  activeLabel,
  inactiveLabel,
  tone = 'revenue',
  disabled = false,
  onClick,
}) {
  const activeStyles = tone === 'cost' ? 'border-rust/40 bg-rust-dim/50' : 'border-amber/50 bg-amber-dim/40'
  const badgeStyles = tone === 'cost' ? 'border-rust/30 text-rust' : 'border-amber/30 text-amber'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border p-4 text-left transition-colors ${
        active ? activeStyles : 'border-line bg-ink-3/50 opacity-75 hover:opacity-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-paper">{label}</p>
          <p className="mt-1 text-xs text-muted">{description}</p>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${active ? badgeStyles : 'border-line text-muted'}`}>
          {active ? activeLabel : inactiveLabel}
        </span>
      </div>
      <p className="mt-3 font-mono text-lg text-paper">{value}</p>
    </button>
  )
}

function BreakdownRow({ label, value, positive }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-ink-3/50 px-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-mono ${positive ? 'text-teal' : 'text-paper'}`}>{value}</dd>
    </div>
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

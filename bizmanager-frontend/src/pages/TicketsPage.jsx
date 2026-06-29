import { useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { ticketsApi } from '../api/tickets'
import { ribbonsApi } from '../api/ribbons'
import { apiErrorMessage } from '../api/client'
import { formatMoney, formatDate, todayIso } from '../utils/format'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Tabs from '../components/ui/Tabs'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import DateRangeBar from '../components/ui/DateRangeBar'
import Modal from '../components/ui/Modal'
import { rangeForPreset } from '../utils/dateRanges'

const TABS = [
  { key: 'pricing', label: 'Pricing' },
  { key: 'ribbons', label: 'Ribbons' },
  { key: 'sales', label: "Today's sale" },
  { key: 'history', label: 'Sales history' },
]

export default function TicketsPage() {
  const [tab, setTab] = useState('pricing')

  return (
    <div>
      <PageHeader eyebrow="Tickets" title="Tickets & ribbons" description="Prices, wristband stock, and daily sales." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-6">
        {tab === 'pricing' && <PricingTab />}
        {tab === 'ribbons' && <RibbonsTab />}
        {tab === 'sales' && <SalesTab />}
        {tab === 'history' && <HistoryTab />}
      </div>
    </div>
  )
}

const DAY_TYPES = ['WEEKDAY', 'WEEKEND']
const CATEGORIES = ['ADULT', 'CHILD']

function PricingTab() {
  const [pricing, setPricing] = useState(null)
  const [editing, setEditing] = useState(null) // { dayType, category, currentPrice }
  const toast = useToast()

  const load = () => ticketsApi.listPricing().then(setPricing).catch((e) => toast.error(apiErrorMessage(e)))
  useEffect(() => {
    load()
  }, [])

  if (!pricing) return <Spinner />

  const find = (dayType, category) => pricing.find((p) => p.dayType === dayType && p.category === category)

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {DAY_TYPES.map((dayType) =>
          CATEGORIES.map((category) => {
            const row = find(dayType, category)
            return (
              <Card key={`${dayType}-${category}`} className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">
                    {dayType} · {category}
                  </p>
                  <p className="mt-1 font-mono text-xl text-paper">{row ? formatMoney(row.price) : '— not set'}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing({ dayType, category, currentPrice: row?.price ?? '' })}
                >
                  {row ? 'Update' : 'Set price'}
                </Button>
              </Card>
            )
          }),
        )}
      </div>

      {editing && (
        <PriceModal
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
            toast.success('Price updated')
          }}
        />
      )}
    </div>
  )
}

function PriceModal({ editing, onClose, onSaved }) {
  const [price, setPrice] = useState(editing.currentPrice)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await ticketsApi.setPrice({ dayType: editing.dayType, category: editing.category, price: Number(price) })
      onSaved()
    } catch (err) {
      setError(apiErrorMessage(err))
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title={`${editing.dayType} · ${editing.category} price`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          autoFocus
        />
        {error && <p className="text-sm text-rust">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save price
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function RibbonsTab() {
  const [stock, setStock] = useState(null)
  const toast = useToast()

  const load = () => ribbonsApi.list().then(setStock).catch((e) => toast.error(apiErrorMessage(e)))
  useEffect(() => {
    load()
  }, [])

  if (!stock) return <Spinner />

  const find = (category) => stock.find((s) => s.category === category)

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CATEGORIES.map((category) => {
          const row = find(category)
          return (
            <Card key={category}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">{category} ribbons</p>
                  <p className="mt-1 font-mono text-2xl text-paper">{row ? row.quantityAvailable : 0}</p>
                  <p className="mt-1 text-xs text-muted">Alert threshold: {row ? row.lowStockThreshold : 200}</p>
                </div>
                {row?.low && <Badge tone="rust">Low stock</Badge>}
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="mt-4">
        <RestockForm onDone={load} />
      </Card>
    </div>
  )
}

function RestockForm({ onDone }) {
  const [category, setCategory] = useState('ADULT')
  const [quantity, setQuantity] = useState('')
  const [threshold, setThreshold] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const restock = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await ribbonsApi.restock({ category, quantity: Number(quantity) })
      toast.success(`Added ${quantity} ${category.toLowerCase()} ribbons`)
      setQuantity('')
      onDone()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const updateThreshold = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await ribbonsApi.setThreshold({ category, threshold: Number(threshold) })
      toast.success(`Threshold updated for ${category.toLowerCase()}`)
      setThreshold('')
      onDone()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={restock} className="flex flex-1 items-end gap-2">
          <Input
            label="Add ribbons"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" loading={saving} size="md">
            <Plus size={16} /> Restock
          </Button>
        </form>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={updateThreshold} className="flex flex-1 items-end gap-2">
          <Input
            label="Low-stock threshold"
            type="number"
            min="0"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" variant="secondary" loading={saving} size="md">
            <RefreshCw size={16} /> Update
          </Button>
        </form>
      </div>
    </div>
  )
}

function SalesTab() {
  const [date, setDate] = useState(todayIso())
  const [adultSold, setAdultSold] = useState('')
  const [childSold, setChildSold] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await ticketsApi.enterSale({ saleDate: date, adultSold: Number(adultSold), childSold: Number(childSold) })
      setResult(res)
      toast.success('Sale recorded')
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input
            label="Adult tickets sold"
            type="number"
            min="0"
            value={adultSold}
            onChange={(e) => setAdultSold(e.target.value)}
            required
          />
          <Input
            label="Child tickets sold"
            type="number"
            min="0"
            value={childSold}
            onChange={(e) => setChildSold(e.target.value)}
            required
          />
          <p className="text-xs text-muted">
            Re-entering numbers for a date you've already logged corrects it — ribbon stock adjusts by the difference.
          </p>
          {error && <p className="text-sm text-rust">{error}</p>}
          <Button type="submit" loading={saving}>
            Save today's sale
          </Button>
        </form>
      </Card>

      {result && (
        <Card>
          <p className="mb-3 text-xs uppercase tracking-wide text-muted">{formatDate(result.saleDate)} · {result.dayType}</p>
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Adult" value={`${result.adultSold} × ${formatMoney(result.adultPriceUsed)} = ${formatMoney(result.adultRevenue)}`} />
            <Row label="Child" value={`${result.childSold} × ${formatMoney(result.childPriceUsed)} = ${formatMoney(result.childRevenue)}`} />
            <Row label="Total revenue" value={formatMoney(result.totalRevenue)} strong />
          </dl>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between border-b border-line/60 pb-2 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className={strong ? 'font-mono text-base text-amber' : 'font-mono text-paper'}>{value}</dd>
    </div>
  )
}

function HistoryTab() {
  const [range, setRange] = useState(rangeForPreset('7d'))
  const [sales, setSales] = useState(null)
  const toast = useToast()

  useEffect(() => {
    ticketsApi
      .listSales(range.from, range.to)
      .then(setSales)
      .catch((e) => toast.error(apiErrorMessage(e)))
  }, [range])

  return (
    <div className="flex flex-col gap-4">
      <DateRangeBar from={range.from} to={range.to} onChange={setRange} />
      {!sales ? (
        <Spinner />
      ) : (
        <Table
          emptyMessage="No ticket sales logged in this range."
          rows={sales}
          columns={[
            { key: 'saleDate', header: 'Date', render: (r) => formatDate(r.saleDate) },
            { key: 'dayType', header: 'Day' },
            { key: 'adultSold', header: 'Adult', align: 'right' },
            { key: 'childSold', header: 'Child', align: 'right' },
            { key: 'totalRevenue', header: 'Revenue', align: 'right', render: (r) => formatMoney(r.totalRevenue) },
          ]}
        />
      )}
    </div>
  )
}

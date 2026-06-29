import { useEffect, useState } from 'react'
import { Minus, Plus, Pencil, RotateCcw, Save, Trash2 } from 'lucide-react'
import { stockApi } from '../api/stock'
import { apiErrorMessage } from '../api/client'
import { formatMoney, formatDate, todayIso } from '../utils/format'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { Permission } from '../utils/permissions'
import PageHeader from '../components/ui/PageHeader'
import Tabs from '../components/ui/Tabs'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import DateRangeBar from '../components/ui/DateRangeBar'
import { rangeForPreset } from '../utils/dateRanges'

export default function StockPage() {
  const { hasAnyPermission } = useAuth()
  const canManage = hasAnyPermission([Permission.MANAGE_STOCK_ITEMS])
  const canSell = hasAnyPermission([Permission.ENTER_STOCK_SALE])

  const tabs = [
    { key: 'items', label: 'Catalogue' },
    canSell && { key: 'sell', label: 'Log a sale' },
    canManage && { key: 'history', label: 'Sales history' },
    canManage && { key: 'best', label: 'Best sellers' },
  ].filter(Boolean)

  const [tab, setTab] = useState(tabs[0]?.key)

  return (
    <div>
      <PageHeader eyebrow="Stock" title="Stock" description="Shop catalogue and what's sold." />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="mt-6">
        {tab === 'items' && <CatalogueTab canManage={canManage} />}
        {tab === 'sell' && <SellTab />}
        {tab === 'history' && <HistoryTab />}
        {tab === 'best' && <BestSellersTab />}
      </div>
    </div>
  )
}

function CatalogueTab({ canManage }) {
  const [items, setItems] = useState(null)
  const [editing, setEditing] = useState(null) // null = closed, {} = creating, {...item} = editing
  const toast = useToast()

  const load = () => stockApi.listItems().then(setItems).catch((e) => toast.error(apiErrorMessage(e)))
  useEffect(() => {
    load()
  }, [])

  const deactivate = async (item) => {
    try {
      await stockApi.deactivateItem(item.id)
      load()
      toast.success(`Removed "${item.name}"`)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  if (!items) return <Spinner />

  if (!canManage) {
    // StockManager view - name only, exactly what the backend sends them.
    return (
      <Table
        emptyMessage="No items in the catalogue yet."
        rows={items}
        columns={[{ key: 'name', header: 'Item' }]}
      />
    )
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing({})}>
          <Plus size={16} /> Add item
        </Button>
      </div>
      <Table
        emptyMessage="No items in the catalogue yet — add your first one."
        rows={items}
        columns={[
          { key: 'name', header: 'Item' },
          { key: 'quantity', header: 'Qty left', align: 'right' },
          { key: 'costPrice', header: 'Cost', align: 'right', render: (r) => formatMoney(r.costPrice) },
          { key: 'sellingPrice', header: 'Sells for', align: 'right', render: (r) => formatMoney(r.sellingPrice) },
          {
            key: 'low',
            header: 'Status',
            render: (r) => (r.low ? <Badge tone="rust">Low stock</Badge> : <Badge tone="teal">OK</Badge>),
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (r) => (
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditing(r)} className="text-muted hover:text-amber" aria-label="Edit">
                  <Pencil size={16} />
                </button>
                <button onClick={() => deactivate(r)} className="text-muted hover:text-rust" aria-label="Remove">
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit item' : 'Add item'}>
        {editing && (
          <ItemForm
            item={editing}
            onDone={() => {
              setEditing(null)
              load()
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function ItemForm({ item, onDone }) {
  const isEdit = !!item.id
  const [form, setForm] = useState({
    name: item.name || '',
    quantity: item.quantity ?? '',
    costPrice: item.costPrice ?? '',
    sellingPrice: item.sellingPrice ?? '',
    lowStockThreshold: item.lowStockThreshold ?? 10,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      name: form.name,
      quantity: Number(form.quantity),
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      lowStockThreshold: Number(form.lowStockThreshold),
    }
    try {
      if (isEdit) {
        await stockApi.updateItem(item.id, payload)
        toast.success('Item updated')
      } else {
        await stockApi.createItem(payload)
        toast.success(`"${form.name}" added`)
      }
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
      <Input label="Quantity" type="number" min="0" value={form.quantity} onChange={update('quantity')} required />
      <Input label="Cost price" type="number" min="0" step="0.01" value={form.costPrice} onChange={update('costPrice')} required />
      <Input
        label="Selling price"
        type="number"
        min="0"
        step="0.01"
        value={form.sellingPrice}
        onChange={update('sellingPrice')}
        required
      />
      <Input label="Low-stock threshold" type="number" min="0" value={form.lowStockThreshold} onChange={update('lowStockThreshold')} />
      {error && <p className="text-sm text-rust">{error}</p>}
      <Button type="submit" loading={saving}>
        {isEdit ? 'Save changes' : 'Add item'}
      </Button>
    </form>
  )
}

function SellTab() {
  const { user } = useAuth()
  const saleDate = todayIso()
  const tempKey = user?.businessId ? `bizmanager-stock-temp-${user.businessId}-${saleDate}` : null
  const [items, setItems] = useState(null)
  const [savedSales, setSavedSales] = useState([])
  const [tempLog, setTempLog] = useState({})
  const [tempLoaded, setTempLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()

  const load = () =>
    Promise.all([stockApi.listItems(), stockApi.listSales(saleDate, saleDate)]).then(([itemData, saleData]) => {
      setItems(itemData)
      setSavedSales(saleData)
    })

  useEffect(() => {
    load().catch((e) => toast.error(apiErrorMessage(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleDate])

  useEffect(() => {
    if (!tempKey) return
    setTempLoaded(false)
    try {
      const stored = JSON.parse(localStorage.getItem(tempKey) || '{}')
      setTempLog(stored && typeof stored === 'object' ? stored : {})
    } catch {
      setTempLog({})
    }
    setTempLoaded(true)
  }, [tempKey])

  useEffect(() => {
    if (!tempKey || !tempLoaded) return
    localStorage.setItem(tempKey, JSON.stringify(tempLog))
  }, [tempKey, tempLoaded, tempLog])

  const savedByItem = new Map(savedSales.map((sale) => [String(sale.stockItemId), sale]))
  const normalizedTempLog = Object.fromEntries(
    Object.entries(tempLog)
      .map(([itemId, qty]) => [itemId, Math.max(0, Number(qty) || 0)])
      .filter(([, qty]) => qty > 0),
  )
  const tempEntries = Object.entries(normalizedTempLog)
  const tempTotal = tempEntries.reduce((total, [, qty]) => total + qty, 0)
  const savedTotal = savedSales.reduce((total, sale) => total + Number(sale.quantitySold || 0), 0)

  const setTempQty = (itemId, qty) => {
    setTempLog((current) => {
      const next = { ...current }
      const normalized = Math.max(0, Number(qty) || 0)
      if (normalized > 0) next[String(itemId)] = normalized
      else delete next[String(itemId)]
      return next
    })
  }

  const increment = (itemId) => setTempQty(itemId, (Number(tempLog[String(itemId)]) || 0) + 1)
  const decrement = (itemId) => setTempQty(itemId, (Number(tempLog[String(itemId)]) || 0) - 1)
  const clearTemp = () => setTempLog({})

  const submit = async (e) => {
    e.preventDefault()
    if (tempEntries.length === 0) return
    setSaving(true)
    setError(null)
    try {
      for (const [itemId, tempQty] of tempEntries) {
        const savedQty = Number(savedByItem.get(itemId)?.quantitySold || 0)
        await stockApi.logSale({
          stockItemId: Number(itemId),
          saleDate,
          quantitySold: savedQty + tempQty,
        })
      }
      clearTemp()
      await load()
      toast.success(`Saved ${tempTotal} item${tempTotal === 1 ? '' : 's'} for today`)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!items) return <Spinner />

  return (
    <form onSubmit={submit} className="flex max-w-5xl flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Today&apos;s stock log</p>
            <p className="mt-1 text-xl font-semibold text-paper">{formatDate(saleDate)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-right">
            <div>
              <p className="text-xs text-muted">Already saved</p>
              <p className="font-mono text-lg text-paper">{savedTotal}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Temporary</p>
              <p className="font-mono text-lg text-amber">{tempTotal}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0 sm:p-0">
        <div className="divide-y divide-line">
          {items.length === 0 ? (
            <p className="p-4 text-sm text-muted sm:p-5">No stock items available.</p>
          ) : (
            items.map((item) => {
              const itemId = String(item.id)
              const savedQty = Number(savedByItem.get(itemId)?.quantitySold || 0)
              const tempQty = Number(tempLog[itemId]) || 0
              return (
                <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
                  <div>
                    <p className="font-medium text-paper">{item.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      Saved today: {savedQty} · After saving: {savedQty + tempQty}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => decrement(item.id)}
                      disabled={tempQty <= 0}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-ink-3 text-paper transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Decrease ${item.name}`}
                    >
                      <Minus size={18} />
                    </button>
                    <Input
                      aria-label={`${item.name} temporary quantity`}
                      type="number"
                      min="0"
                      value={tempQty || ''}
                      onChange={(e) => setTempQty(item.id, e.target.value)}
                      className="w-24 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => increment(item.id)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-amber/40 bg-amber-dim text-amber transition-colors hover:bg-amber/20"
                      aria-label={`Increase ${item.name}`}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            Temporary counts stay on this device until saved. Saving adds them to today&apos;s permanent stock sale log, then clears the temporary counts.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="secondary" onClick={clearTemp} disabled={tempTotal === 0 || saving}>
              <RotateCcw size={16} /> Clear temp
            </Button>
            <Button type="submit" loading={saving} disabled={tempTotal === 0 || items.length === 0}>
              <Save size={16} /> Save today&apos;s sales
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-rust">{error}</p>}
      </Card>
    </form>
  )
}

function HistoryTab() {
  const [range, setRange] = useState(rangeForPreset('7d'))
  const [sales, setSales] = useState(null)
  const toast = useToast()

  useEffect(() => {
    stockApi
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
          emptyMessage="No stock sales logged in this range."
          rows={sales}
          columns={[
            { key: 'saleDate', header: 'Date', render: (r) => formatDate(r.saleDate) },
            { key: 'stockItemName', header: 'Item' },
            { key: 'quantitySold', header: 'Qty', align: 'right' },
            { key: 'revenueGenerated', header: 'Revenue', align: 'right', render: (r) => formatMoney(r.revenueGenerated) },
            { key: 'profitGenerated', header: 'Profit', align: 'right', render: (r) => formatMoney(r.profitGenerated) },
            { key: 'enteredByName', header: 'Logged by' },
          ]}
        />
      )}
    </div>
  )
}

function BestSellersTab() {
  const [range, setRange] = useState(rangeForPreset('month'))
  const [items, setItems] = useState(null)
  const toast = useToast()

  useEffect(() => {
    stockApi
      .bestSellers(range.from, range.to, 10)
      .then(setItems)
      .catch((e) => toast.error(apiErrorMessage(e)))
  }, [range])

  return (
    <div className="flex flex-col gap-4">
      <DateRangeBar from={range.from} to={range.to} onChange={setRange} />
      {!items ? (
        <Spinner />
      ) : (
        <Table
          emptyMessage="No sales in this range yet."
          rows={items}
          keyField="itemId"
          columns={[
            { key: 'itemName', header: 'Item' },
            { key: 'totalQuantitySold', header: 'Units sold', align: 'right' },
            { key: 'totalRevenue', header: 'Revenue', align: 'right', render: (r) => formatMoney(r.totalRevenue) },
          ]}
        />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import Select from '../components/ui/Select'
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
  const [items, setItems] = useState(null)
  const [stockItemId, setStockItemId] = useState('')
  const [date, setDate] = useState(todayIso())
  const [quantitySold, setQuantitySold] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()

  useEffect(() => {
    stockApi.listItems().then((data) => {
      setItems(data)
      if (data.length > 0) setStockItemId((prev) => prev || String(data[0].id))
    })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await stockApi.logSale({ stockItemId: Number(stockItemId), saleDate: date, quantitySold: Number(quantitySold) })
      toast.success(`Logged ${res.quantitySold} sold — ${formatMoney(res.revenueGenerated)} revenue`)
      setQuantitySold('')
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!items) return <Spinner />

  return (
    <Card className="max-w-lg">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Select label="Item" value={stockItemId} onChange={(e) => setStockItemId(e.target.value)}>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </Select>
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input label="Quantity sold" type="number" min="0" value={quantitySold} onChange={(e) => setQuantitySold(e.target.value)} required />
        <p className="text-xs text-muted">Re-logging the same item and date corrects it — remaining stock adjusts by the difference.</p>
        {error && <p className="text-sm text-rust">{error}</p>}
        <Button type="submit" loading={saving}>
          Save sale
        </Button>
      </form>
    </Card>
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

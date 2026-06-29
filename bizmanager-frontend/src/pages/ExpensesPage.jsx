import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { expensesApi } from '../api/expenses'
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
import Spinner from '../components/ui/Spinner'
import DateRangeBar from '../components/ui/DateRangeBar'
import { rangeForPreset } from '../utils/dateRanges'

const TABS = [
  { key: 'log', label: 'Log expense' },
  { key: 'items', label: 'Categories' },
  { key: 'history', label: 'History' },
]

export default function ExpensesPage() {
  const [tab, setTab] = useState('log')
  const [itemsVersion, setItemsVersion] = useState(0) // bumped after item create/deactivate so LogTab refetches

  return (
    <div>
      <PageHeader eyebrow="Expenses" title="Expenses" description="What it costs to run the day." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-6">
        {tab === 'log' && <LogTab itemsVersion={itemsVersion} />}
        {tab === 'items' && <ItemsTab onChanged={() => setItemsVersion((v) => v + 1)} />}
        {tab === 'history' && <HistoryTab />}
      </div>
    </div>
  )
}

function ItemsTab({ onChanged }) {
  const [items, setItems] = useState(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const load = () => expensesApi.listItems(false).then(setItems).catch((e) => toast.error(apiErrorMessage(e)))
  useEffect(() => {
    load()
  }, [])

  const create = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await expensesApi.createItem(name)
      setName('')
      load()
      onChanged()
      toast.success(`Added "${name}" as an expense category`)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (item) => {
    try {
      await expensesApi.deactivateItem(item.id)
      load()
      onChanged()
      toast.success(`Removed "${item.name}"`)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={create} className="flex items-end gap-2">
          <Input
            label="New category"
            placeholder="e.g. Diesel, Electricity, Maintenance"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" loading={saving}>
            <Plus size={16} /> Add
          </Button>
        </form>
      </Card>

      {!items ? (
        <Spinner />
      ) : (
        <Table
          emptyMessage="No expense categories yet — add your first one above."
          rows={items}
          columns={[
            { key: 'name', header: 'Category' },
            {
              key: 'active',
              header: 'Status',
              render: (r) => (r.active ? <span className="text-teal">Active</span> : <span className="text-muted">Inactive</span>),
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (r) =>
                r.active && (
                  <button onClick={() => deactivate(r)} className="text-muted hover:text-rust" aria-label="Remove">
                    <Trash2 size={16} />
                  </button>
                ),
            },
          ]}
        />
      )}
    </div>
  )
}

function LogTab({ itemsVersion }) {
  const [items, setItems] = useState(null)
  const [expenseItemId, setExpenseItemId] = useState('')
  const [date, setDate] = useState(todayIso())
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    expensesApi.listItems(true).then((data) => {
      setItems(data)
      if (data.length > 0) setExpenseItemId((prev) => prev || String(data[0].id))
    })
  }, [itemsVersion])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await expensesApi.log({ expenseItemId: Number(expenseItemId), expenseDate: date, amount: Number(amount) })
      toast.success('Expense logged')
      setAmount('')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!items) return <Spinner />

  if (items.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          No expense categories yet. Add one in the <span className="text-paper">Categories</span> tab before logging an
          expense.
        </p>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Select label="Category" value={expenseItemId} onChange={(e) => setExpenseItemId(e.target.value)}>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </Select>
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input
          label="Amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <p className="text-xs text-muted">Re-logging the same category and date corrects the earlier amount.</p>
        <Button type="submit" loading={saving}>
          Save expense
        </Button>
      </form>
    </Card>
  )
}

function HistoryTab() {
  const [range, setRange] = useState(rangeForPreset('7d'))
  const [expenses, setExpenses] = useState(null)
  const toast = useToast()

  useEffect(() => {
    expensesApi
      .list(range.from, range.to)
      .then(setExpenses)
      .catch((e) => toast.error(apiErrorMessage(e)))
  }, [range])

  const total = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0

  return (
    <div className="flex flex-col gap-4">
      <DateRangeBar from={range.from} to={range.to} onChange={setRange} />
      {!expenses ? (
        <Spinner />
      ) : (
        <>
          <Table
            emptyMessage="No expenses logged in this range."
            rows={expenses}
            columns={[
              { key: 'expenseDate', header: 'Date', render: (r) => formatDate(r.expenseDate) },
              { key: 'expenseItemName', header: 'Category' },
              { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatMoney(r.amount) },
            ]}
          />
          {expenses.length > 0 && (
            <p className="text-right text-sm text-muted">
              Total: <span className="font-mono text-paper">{formatMoney(total)}</span>
            </p>
          )}
        </>
      )}
    </div>
  )
}

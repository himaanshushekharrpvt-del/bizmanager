import EmptyState from './EmptyState'

/**
 * columns: [{ key, header, render?(row), align?, className? }]
 * rows: array of data objects
 * keyField: property used as the React key (defaults to 'id')
 */
export default function Table({ columns, rows, keyField = 'id', emptyMessage = 'Nothing here yet.' }) {
  if (!rows || rows.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-ink-3">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`whitespace-nowrap px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted ${col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[keyField]} className="border-b border-line/60 last:border-0 hover:bg-ink-3/50">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-paper ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.className || ''}`}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

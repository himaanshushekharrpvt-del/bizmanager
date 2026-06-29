import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { auditLogApi } from '../api/auditLog'
import { apiErrorMessage } from '../api/client'
import { formatDateTime } from '../utils/format'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Table from '../components/ui/Table'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'

export default function AuditLogPage() {
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const toast = useToast()

  useEffect(() => {
    auditLogApi
      .list({ page, size: 25 })
      .then(setData)
      .catch((e) => toast.error(apiErrorMessage(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <div>
      <PageHeader eyebrow="Audit log" title="Audit log" description="Every sensitive change, with who made it and when." />

      {!data ? (
        <Spinner />
      ) : (
        <>
          <Table
            emptyMessage="No audit entries yet."
            rows={data.content}
            columns={[
              { key: 'createdAt', header: 'When', render: (r) => formatDateTime(r.createdAt) },
              { key: 'actorName', header: 'Who' },
              { key: 'action', header: 'Action' },
              { key: 'entityType', header: 'Entity' },
              {
                key: 'change',
                header: 'Change',
                render: (r) => (
                  <span className="text-xs text-muted">
                    {r.oldValue && <span className="line-through">{r.oldValue}</span>} {r.oldValue && '→'} {r.newValue}
                    {r.notes && <span className="block">{r.notes}</span>}
                  </span>
                ),
              },
            ]}
          />

          {data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted">
                Page {data.number + 1} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={14} /> Prev
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page + 1 >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { alertsApi } from '../api/alerts'
import { apiErrorMessage } from '../api/client'
import { formatDateTime } from '../utils/format'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(null)
  const [includeResolved, setIncludeResolved] = useState(false)
  const toast = useToast()

  useEffect(() => {
    alertsApi
      .list(includeResolved)
      .then(setAlerts)
      .catch((e) => toast.error(apiErrorMessage(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeResolved])

  return (
    <div>
      <PageHeader
        eyebrow="Alerts"
        title="Alerts"
        description="Low ribbon and item stock, surfaced automatically."
        actions={
          <Button variant="secondary" size="sm" onClick={() => setIncludeResolved((v) => !v)}>
            {includeResolved ? 'Show active only' : 'Show resolved too'}
          </Button>
        }
      />

      {!alerts ? (
        <Spinner />
      ) : alerts.length === 0 ? (
        <EmptyState message="No active alerts — stock levels are healthy." icon={CheckCircle2} />
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((a) => (
            <Card key={a.id} className={a.resolved ? 'opacity-60' : ''}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className={a.resolved ? 'text-muted' : 'text-rust'} />
                <div className="flex-1">
                  <p className="text-sm text-paper">{a.message}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(a.createdAt)} {a.resolved && '· resolved'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

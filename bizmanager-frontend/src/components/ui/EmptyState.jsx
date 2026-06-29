import { Inbox } from 'lucide-react'

export default function EmptyState({ message = 'Nothing here yet.', action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line px-6 py-12 text-center">
      <Icon size={28} className="text-muted" />
      <p className="max-w-xs text-sm text-muted">{message}</p>
      {action}
    </div>
  )
}

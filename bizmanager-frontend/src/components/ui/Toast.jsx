import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, type }])
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
    },
    [dismiss],
  )

  const toast = {
    success: (msg) => push(msg, 'success'),
    error: (msg) => push(msg, 'error'),
    info: (msg) => push(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:w-full sm:translate-x-0">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }) {
  const styles = {
    success: { icon: CheckCircle2, color: 'text-teal', border: 'border-teal/40' },
    error: { icon: XCircle, color: 'text-rust', border: 'border-rust/40' },
    info: { icon: Info, color: 'text-indigo', border: 'border-indigo/40' },
  }[toast.type]
  const Icon = styles.icon

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border ${styles.border} bg-ink-2 px-4 py-3 shadow-lg shadow-black/30 animate-in`}
      role="status"
    >
      <Icon size={18} className={`mt-0.5 flex-none ${styles.color}`} />
      <p className="flex-1 text-sm text-paper">{toast.message}</p>
      <button onClick={onDismiss} className="flex-none text-muted hover:text-paper" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

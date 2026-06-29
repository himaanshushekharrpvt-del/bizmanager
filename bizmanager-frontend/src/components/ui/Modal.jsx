import { useEffect } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <button
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={onClose}
        tabIndex={-1}
      />
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-ink-2 p-5 shadow-2xl sm:max-w-md sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-paper">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-paper" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

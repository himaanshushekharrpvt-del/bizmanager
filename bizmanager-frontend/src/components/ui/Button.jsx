import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-amber text-ink hover:bg-amber/90 disabled:bg-amber/40',
  secondary: 'bg-ink-3 text-paper border border-line hover:bg-line disabled:opacity-50',
  danger: 'bg-rust text-paper hover:bg-rust/90 disabled:bg-rust/40',
  ghost: 'bg-transparent text-paper hover:bg-ink-3 disabled:opacity-40',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

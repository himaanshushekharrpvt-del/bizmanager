import clsx from 'clsx'

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx('rounded-2xl border border-line bg-ink-2 p-4 sm:p-5', className)}
      {...props}
    >
      {children}
    </div>
  )
}

import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink px-4 text-center">
      <p className="font-display text-4xl font-semibold text-paper">404</p>
      <p className="text-sm text-muted">That page doesn't exist.</p>
      <Link to="/" className="mt-2 text-sm font-medium text-amber hover:underline">
        Back to dashboard
      </Link>
    </div>
  )
}

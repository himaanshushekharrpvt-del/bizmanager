import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RequirePermission({ any, children }) {
  const { hasAnyPermission } = useAuth()
  if (any && any.length > 0 && !hasAnyPermission(any)) {
    return <Navigate to="/" replace />
  }
  return children
}

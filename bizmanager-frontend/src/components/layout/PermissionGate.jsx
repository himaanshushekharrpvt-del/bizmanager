import { useAuth } from '../../context/AuthContext'

/**
 * <PermissionGate any={[Permission.MANAGE_TICKETS]}>...</PermissionGate>
 * Renders children only if the user has at least one of the listed permissions.
 * With no `any` prop, renders unconditionally (useful as a no-op wrapper).
 */
export default function PermissionGate({ any, fallback = null, children }) {
  const { hasAnyPermission } = useAuth()
  if (!any || any.length === 0) return children
  return hasAnyPermission(any) ? children : fallback
}

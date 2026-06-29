import client from './client'

export const auditLogApi = {
  list: ({ from, to, entityType, page = 0, size = 25 } = {}) =>
    client.get('/api/audit-log', { params: { from, to, entityType, page, size } }).then((r) => r.data),
}

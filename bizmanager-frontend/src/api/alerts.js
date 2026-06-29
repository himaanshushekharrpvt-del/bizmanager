import client from './client'

export const alertsApi = {
  list: (includeResolved = false) =>
    client.get('/api/alerts', { params: { includeResolved } }).then((r) => r.data),
}

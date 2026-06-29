import client from './client'

export const analyticsApi = {
  dashboard: () => client.get('/api/analytics/dashboard').then((r) => r.data),
  revenue: (from, to) => client.get('/api/analytics/revenue', { params: { from, to } }).then((r) => r.data),
  insights: (from, to) => client.get('/api/analytics/insights', { params: { from, to } }).then((r) => r.data),
}

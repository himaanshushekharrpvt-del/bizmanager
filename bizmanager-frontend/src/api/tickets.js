import client from './client'

export const ticketsApi = {
  listPricing: () => client.get('/api/tickets/pricing').then((r) => r.data),
  listPricingHistory: () => client.get('/api/tickets/pricing/history').then((r) => r.data),
  setPrice: (data) => client.post('/api/tickets/pricing', data).then((r) => r.data),
  enterSale: (data) => client.post('/api/tickets/sales', data).then((r) => r.data),
  listSales: (from, to) => client.get('/api/tickets/sales', { params: { from, to } }).then((r) => r.data),
}

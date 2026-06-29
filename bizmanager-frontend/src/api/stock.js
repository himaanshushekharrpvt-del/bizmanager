import client from './client'

export const stockApi = {
  listItems: () => client.get('/api/stock/items').then((r) => r.data),
  createItem: (data) => client.post('/api/stock/items', data).then((r) => r.data),
  updateItem: (itemId, data) => client.put(`/api/stock/items/${itemId}`, data).then((r) => r.data),
  deactivateItem: (itemId) => client.delete(`/api/stock/items/${itemId}`),

  logSale: (data) => client.post('/api/stock/sales', data).then((r) => r.data),
  listSales: (from, to) => client.get('/api/stock/sales', { params: { from, to } }).then((r) => r.data),
  bestSellers: (from, to, limit = 5) =>
    client.get('/api/stock/best-sellers', { params: { from, to, limit } }).then((r) => r.data),
}

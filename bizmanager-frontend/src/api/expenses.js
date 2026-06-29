import client from './client'

export const expensesApi = {
  listItems: (activeOnly = true) =>
    client.get('/api/expenses/items', { params: { activeOnly } }).then((r) => r.data),
  createItem: (name) => client.post('/api/expenses/items', { name }).then((r) => r.data),
  deactivateItem: (itemId) => client.delete(`/api/expenses/items/${itemId}`),
  log: (data) => client.post('/api/expenses', data).then((r) => r.data),
  list: (from, to) => client.get('/api/expenses', { params: { from, to } }).then((r) => r.data),
}

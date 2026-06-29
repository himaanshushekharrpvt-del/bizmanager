import client from './client'

export const ribbonsApi = {
  list: () => client.get('/api/ribbons').then((r) => r.data),
  restock: (data) => client.post('/api/ribbons/restock', data).then((r) => r.data),
  setThreshold: (data) => client.put('/api/ribbons/threshold', data).then((r) => r.data),
}

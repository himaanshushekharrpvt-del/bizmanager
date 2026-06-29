import client from './client'

export const usersApi = {
  list: () => client.get('/api/users').then((r) => r.data),
  get: (userId) => client.get(`/api/users/${userId}`).then((r) => r.data),
  createAdmin: (data) => client.post('/api/users/admins', data).then((r) => r.data),
  createStaffAccount: (data) => client.post('/api/users', data).then((r) => r.data),
  deactivate: (userId) => client.delete(`/api/users/${userId}`),
  resetPassword: (userId, newPassword) =>
    client.put(`/api/users/${userId}/reset-password`, { newPassword }),
}

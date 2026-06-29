import client from './client'

export const rolesApi = {
  list: () => client.get('/api/roles').then((r) => r.data),
  listAssignable: () => client.get('/api/roles/assignable').then((r) => r.data),
  create: (data) => client.post('/api/roles', data).then((r) => r.data),
  updatePermissions: (roleId, permissions) =>
    client.put(`/api/roles/${roleId}/permissions`, { permissions }).then((r) => r.data),
  remove: (roleId) => client.delete(`/api/roles/${roleId}`),
}
